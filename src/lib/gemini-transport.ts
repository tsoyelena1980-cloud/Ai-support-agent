import { GoogleGenAI } from "@google/genai";
import { FUNCTION_DECLARATIONS } from "@/domain/tools";
import { SYSTEM_INSTRUCTION } from "@/lib/system-prompt";
import { MODEL_REGISTRY, type SupportedModelId, type ThinkingLevel } from "@/lib/models";
import { maskApiKey } from "@/lib/key-vault";

export const GEMINI_HOST = "https://generativelanguage.googleapis.com";

export interface GeminiPart {
  text?: string;
  thoughtSignature?: string;
  functionCall?: { name?: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name?: string; response?: Record<string, unknown>; id?: string };
  inlineData?: { mimeType: string; data: string };
  [key: string]: unknown;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GenerateRequest {
  url: string;
  headers: Record<string, string>;
  body: {
    systemInstruction: { parts: Array<{ text: string }> };
    contents: GeminiContent[];
    tools: Array<{ functionDeclarations: typeof FUNCTION_DECLARATIONS }>;
    generationConfig: {
      thinkingConfig: { thinkingLevel: ThinkingLevel };
      maxOutputTokens: number;
    };
  };
}

const FORBIDDEN_GENERATION_KEYS = ["temperature", "topP", "topK", "top_p", "top_k"] as const;

export function assertSendableHistory(contents: GeminiContent[]): void {
  const last = contents[contents.length - 1];
  if (!last || (last.role !== "user" && last.role !== "model")) {
    throw new Error("История пуста.");
  }
  if (last.role === "model") {
    throw new Error("Последний ход принадлежит модели. Отправка заблокирована, пока гость не напишет снова.");
  }
}

export function buildGenerateRequest(input: {
  apiKey: string;
  model: SupportedModelId;
  thinkingLevel: ThinkingLevel;
  contents: GeminiContent[];
}): GenerateRequest {
  assertSendableHistory(input.contents);
  const url = `${GEMINI_HOST}/v1beta/models/${input.model}:generateContent`;
  if (url.includes("?")) {
    throw new Error("Ключ нельзя передавать в query-параметре.");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-goog-api-key": input.apiKey,
  };
  if ("authorization" in headers || "Authorization" in headers) {
    throw new Error("Заголовок Authorization запрещён для ключей AQ.");
  }
  const generationConfig: GenerateRequest["body"]["generationConfig"] = {
    thinkingConfig: { thinkingLevel: input.thinkingLevel },
    maxOutputTokens: MODEL_REGISTRY[input.model].maxOutputTokens,
  };
  for (const key of FORBIDDEN_GENERATION_KEYS) {
    if (key in generationConfig) {
      throw new Error(`Поле ${key} запрещено для Gemini 3.`);
    }
  }
  return {
    url,
    headers,
    body: {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: input.contents,
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      generationConfig,
    },
  };
}

export interface SanitizedDebug {
  url: string;
  headerNames: string[];
  apiKeyHeader: string;
  generationConfig: GenerateRequest["body"]["generationConfig"];
  hasTemperature: boolean;
  hasTopP: boolean;
  hasTopK: boolean;
  hasAuthorization: boolean;
  keyInQuery: boolean;
}

export function sanitizeDebug(request: GenerateRequest, apiKey: string): SanitizedDebug {
  const serialized = JSON.stringify(request.body.generationConfig);
  return {
    url: request.url,
    headerNames: Object.keys(request.headers),
    apiKeyHeader: maskApiKey(apiKey),
    generationConfig: request.body.generationConfig,
    hasTemperature: /temperature/i.test(serialized),
    hasTopP: /topP|top_p/i.test(serialized),
    hasTopK: /topK|top_k/i.test(serialized),
    hasAuthorization: Object.keys(request.headers).some((name) => name.toLowerCase() === "authorization"),
    keyInQuery: request.url.includes("key="),
  };
}

export function retryDelayMs(attemptIndex: number, randomUnit = Math.random()): number {
  const jitter = Math.min(1, Math.max(0, randomUnit)) * 250;
  return 800 * 2 ** attemptIndex + jitter;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: { role?: string; parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { code?: number; message?: string; status?: string };
}

export class GeminiHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function bindOfficialClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

export async function postGenerateContent(
  request: GenerateRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<GeminiResponse> {
  const apiKey = request.headers["x-goog-api-key"];
  if (!apiKey || !bindOfficialClient(apiKey).models) {
    throw new Error("Официальный клиент @google/genai не принял ключ.");
  }
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt - 1)));
    }
    let response: Response;
    try {
      response = await fetchImpl(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(request.body),
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Сеть Gemini недоступна.");
      continue;
    }
    const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
    if (response.ok) return payload;
    const message = payload.error?.message || `Gemini ответил ${response.status}.`;
    lastError = new GeminiHttpError(response.status, message);
    if (response.status !== 429 && response.status !== 503) break;
  }
  throw lastError ?? new Error("Не удалось связаться с Gemini.");
}

export async function probeApiKey(apiKey: string, fetchImpl: typeof fetch = fetch): Promise<number> {
  const response = await fetchImpl(`${GEMINI_HOST}/v1beta/models/gemini-3.5-flash-lite`, {
    method: "GET",
    headers: { "x-goog-api-key": apiKey },
  });
  return response.status;
}
