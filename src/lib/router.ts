import { MODEL_REGISTRY, type SupportedModelId, type ThinkingLevel } from "@/lib/models";

export type QuerySource = "chat" | "omakase" | "sommelier";

const COMPLEX_PATTERN =
  /(омакасе|дегустационн|сет на компанию|саке|пейринг|вино|сомелье|бюджет|возврат|жалоба|отравлен|испорчен)/i;

const TOOL_PATTERN =
  /(бронь|стол|забронир|свободн|аллерг|острот|меню|заказ|доставк|статус|корзин)/i;

export interface RouteInput {
  text: string;
  hasMedia: boolean;
  source: QuerySource;
  mode: SupportedModelId | "auto";
  thinkingOverride?: ThinkingLevel;
}

export interface RouteDecision {
  model: SupportedModelId;
  thinkingLevel: ThinkingLevel;
  reason: string;
}

export function routeQuery(input: RouteInput): RouteDecision {
  if (input.source === "omakase") {
    return {
      model: "gemini-3.8-flash",
      thinkingLevel: "high",
      reason: "Виджет омакасе всегда идёт в Gemini 3.8 Flash с thinkingLevel high.",
    };
  }

  if (input.source === "sommelier") {
    return {
      model: "gemini-3.8-flash",
      thinkingLevel: "high",
      reason: "Запрос сомелье с карточки блюда идёт в Gemini 3.8 Flash.",
    };
  }

  if (input.mode !== "auto") {
    return {
      model: input.mode,
      thinkingLevel: input.thinkingOverride ?? MODEL_REGISTRY[input.mode].defaultThinkingLevel,
      reason: "Модель выбрана вручную.",
    };
  }

  if (COMPLEX_PATTERN.test(input.text)) {
    return {
      model: "gemini-3.8-flash",
      thinkingLevel: "high",
      reason: "Сложный гастрономический запрос или претензия.",
    };
  }

  if (input.hasMedia || TOOL_PATTERN.test(input.text)) {
    return {
      model: "gemini-3.6-flash",
      thinkingLevel: "medium",
      reason: input.hasMedia
        ? "К сообщению приложено фото."
        : "Запрос похож на меню, бронь или доставку.",
    };
  }

  return {
    model: "gemini-3.5-flash-lite",
    thinkingLevel: "minimal",
    reason: "Короткий информационный вопрос.",
  };
}
