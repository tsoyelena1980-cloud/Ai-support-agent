import { create } from "zustand";
import { executeTool, type ToolOutcome } from "@/domain/tools";
import { costForTurn, sumSessionCost, type TurnCost } from "@/lib/cost";
import {
  buildGenerateRequest,
  GeminiHttpError,
  postGenerateContent,
  sanitizeDebug,
  type GeminiContent,
  type GeminiPart,
  type SanitizedDebug,
} from "@/lib/gemini-transport";
import { MODEL_REGISTRY, type SupportedModelId, type ThinkingLevel } from "@/lib/models";
import { routeQuery, type QuerySource, type RouteDecision } from "@/lib/router";
import { classifyGuestMessage, managerRedirectText } from "@/lib/scope";
import { applyToolOutcome } from "@/store/apply-tool";
import { useAuth } from "@/store/auth-store";
import { useRestaurant } from "@/store/restaurant-store";
import { useUi } from "@/store/ui-store";

export type ChatItem =
  | { id: string; type: "user"; text: string; attachment?: string }
  | { id: string; type: "assistant"; text: string; model: string; thinking: ThinkingLevel }
  | { id: string; type: "tool"; name: string; summary: string }
  | { id: string; type: "ticket"; code: string; detail: string }
  | { id: string; type: "handoff"; text: string }
  | { id: string; type: "error"; text: string };

interface AgentState {
  items: ChatItem[];
  contents: GeminiContent[];
  mode: SupportedModelId | "auto";
  thinkingLevel: ThinkingLevel;
  turns: TurnCost[];
  sessionCost: number;
  lastRoute: RouteDecision | null;
  lastDebug: SanitizedDebug | null;
  sending: boolean;
  fallbackOffer: boolean;
  draft: string;
  setMode: (mode: SupportedModelId | "auto") => void;
  setThinkingLevel: (thinkingLevel: ThinkingLevel) => void;
  setDraft: (draft: string) => void;
  clearSession: () => void;
  send: (input: { text: string; inlineData?: { mimeType: string; data: string }; source: QuerySource }) => Promise<void>;
  fallbackToLite: () => Promise<void>;
}

const TOOL_LABELS: Record<string, string> = {
  search_pan_asian_menu: "Меню",
  get_sommelier_pairing: "Сомелье",
  check_table_availability: "Карта зала",
  create_reservation: "Посадочный талон",
  handoff_to_manager: "Менеджер",
  track_or_resolve_order_issue: "Доставка",
};

function uid(): string {
  return crypto.randomUUID();
}

function joinedText(parts: GeminiPart[]): string {
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function summarize(name: string, outcome: ToolOutcome): string {
  if (!outcome.ok) return outcome.error;
  if (name === "search_pan_asian_menu") return `В меню нашлось блюд: ${String(outcome.data.count)}`;
  if (name === "check_table_availability") {
    const tables = outcome.data.available_tables;
    const count = Array.isArray(tables) ? tables.length : 0;
    return count ? `Свободных столов: ${count}` : "В этой зоне свободных столов нет";
  }
  if (name === "create_reservation") return `Бронь ${String(outcome.data.reservation_code)} подтверждена`;
  if (name === "handoff_to_manager") return `Передано ${String(outcome.data.manager_name)}`;
  if (name === "get_sommelier_pairing") return "Пейринг собран";
  return `Статус заказа: ${String(outcome.data.status ?? "обновлён")}`;
}

async function runLoop(
  get: () => AgentState,
  set: (partial: Partial<AgentState> | ((state: AgentState) => Partial<AgentState>)) => void,
  route: RouteDecision,
): Promise<void> {
  const apiKey = useAuth.getState().apiKey;
  if (!apiKey) throw new Error("Сначала активируйте ключ AQ.");

  for (let round = 0; round < 4; round += 1) {
    const contents = get().contents;
    const request = buildGenerateRequest({
      apiKey,
      model: route.model,
      thinkingLevel: route.thinkingLevel,
      contents,
    });
    set({ lastDebug: sanitizeDebug(request, apiKey), lastRoute: route });
    const response = await postGenerateContent(request);
    const turn = costForTurn(route.model, response.usageMetadata);
    set((state) => {
      const turns = [...state.turns, turn];
      return { turns, sessionCost: sumSessionCost(turns) };
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const calls = parts.filter((part) => part.functionCall?.name);
    if (calls.length === 0) {
      const text = joinedText(parts) || "Кицунэ промолчал. Сформулируйте вопрос иначе.";
      set((state) => ({
        contents: [...state.contents, { role: "model", parts: parts.length ? parts : [{ text }] }],
        items: [
          ...state.items,
          { id: uid(), type: "assistant", text, model: route.model, thinking: route.thinkingLevel },
        ],
      }));
      return;
    }

    const responseParts: GeminiPart[] = [];
    const items: ChatItem[] = [];
    for (const part of calls) {
      const name = part.functionCall?.name ?? "";
      const outcome = executeTool(name, part.functionCall?.args ?? {}, {
        reservations: useRestaurant.getState().reservations,
        orders: useRestaurant.getState().orders,
      });
      applyToolOutcome(outcome);
      items.push({
        id: uid(),
        type: "tool",
        name: TOOL_LABELS[name] ?? name,
        summary: summarize(name, outcome),
      });
      if (outcome.ok && name === "create_reservation") {
        items.push({
          id: uid(),
          type: "ticket",
          code: String(outcome.data.reservation_code),
          detail: String(outcome.data.ticket ?? ""),
        });
      }
      if (outcome.ok && name === "handoff_to_manager") {
        items.push({ id: uid(), type: "handoff", text: String(outcome.data.message ?? "") });
      }
      const response: GeminiPart["functionResponse"] = {
        name,
        response: outcome.ok ? outcome.data : { error: outcome.error },
      };
      if (part.functionCall?.id) response.id = part.functionCall.id;
      responseParts.push({ functionResponse: response });
    }
    set((state) => ({
      contents: [
        ...state.contents,
        { role: "model", parts },
        { role: "user", parts: responseParts },
      ],
      items: [...state.items, ...items],
    }));
  }
  throw new Error("Кицунэ слишком долго ходил по инструментам. Уточните просьбу.");
}

export const useAgent = create<AgentState>((set, get) => ({
  items: [],
  contents: [],
  mode: "auto",
  thinkingLevel: "medium",
  turns: [],
  sessionCost: 0,
  lastRoute: null,
  lastDebug: null,
  sending: false,
  fallbackOffer: false,
  draft: "",
  setMode: (mode) => set({ mode }),
  setThinkingLevel: (thinkingLevel) => set({ thinkingLevel }),
  setDraft: (draft) => set({ draft }),
  clearSession: () =>
    set({
      items: [],
      contents: [],
      turns: [],
      sessionCost: 0,
      lastRoute: null,
      lastDebug: null,
      fallbackOffer: false,
      draft: "",
    }),
  send: async ({ text, inlineData, source }) => {
    const trimmed = text.trim();
    if (!trimmed && !inlineData) return;
    if (trimmed && !inlineData && classifyGuestMessage(trimmed).action === "handoff") {
      useUi.getState().openChat();
      set((state) => ({
        draft: "",
        fallbackOffer: false,
        items: [
          ...state.items,
          { id: uid(), type: "user", text: trimmed },
          { id: uid(), type: "handoff", text: managerRedirectText() },
        ],
      }));
      return;
    }
    if (useAuth.getState().status !== "VALID_ACTIVE" || !useAuth.getState().apiKey) {
      useUi.getState().openChat();
      set({
        draft: trimmed,
        items: [
          ...get().items,
          { id: uid(), type: "error", text: "Сначала введите ключ авторизации AQ. из Google AI Studio." },
        ],
      });
      return;
    }
    const route = routeQuery({
      text: trimmed,
      hasMedia: Boolean(inlineData),
      source,
      mode: get().mode,
      thinkingOverride: get().mode === "auto" ? undefined : get().thinkingLevel,
    });
    const parts: GeminiPart[] = [];
    if (trimmed) parts.push({ text: trimmed });
    if (inlineData) parts.push({ inlineData });
    set((state) => {
      const contents = [...state.contents];
      const last = contents[contents.length - 1];
      const replaceFailedUser =
        last?.role === "user" && last.parts.every((part) => part.functionResponse === undefined);
      if (replaceFailedUser) contents.pop();
      return {
        sending: true,
        fallbackOffer: false,
        draft: "",
        contents: [...contents, { role: "user", parts }],
        items: [
          ...state.items,
          { id: uid(), type: "user", text: trimmed || "Фото блюда", attachment: inlineData ? "фото" : undefined },
        ],
      };
    });
    useUi.getState().openChat();
    try {
      await runLoop(get, set, route);
    } catch (error) {
      const status = error instanceof GeminiHttpError ? error.status : 0;
      const message = error instanceof Error ? error.message : "Запрос не выполнен.";
      set({
        fallbackOffer: status === 429 && route.model === "gemini-3.8-flash",
        items: [...get().items, { id: uid(), type: "error", text: message }],
      });
    } finally {
      set({ sending: false });
    }
  },
  fallbackToLite: async () => {
    const route: RouteDecision = {
      model: "gemini-3.5-flash-lite",
      thinkingLevel: MODEL_REGISTRY["gemini-3.5-flash-lite"].defaultThinkingLevel,
      reason: "Ручной fallback после 429 на Gemini 3.8 Flash.",
    };
    set({ sending: true, fallbackOffer: false });
    try {
      await runLoop(get, set, route);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Повтор не выполнен.";
      set({ items: [...get().items, { id: uid(), type: "error", text: message }] });
    } finally {
      set({ sending: false });
    }
  },
}));
