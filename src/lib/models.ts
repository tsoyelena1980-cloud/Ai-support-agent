export type SupportedModelId =
  | "gemini-3.5-flash-lite"
  | "gemini-3.6-flash"
  | "gemini-3.8-flash";

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

export interface ModelSpec {
  id: SupportedModelId;
  displayName: string;
  defaultThinkingLevel: ThinkingLevel;
  pricePerMillionInputUSD: number;
  pricePerMillionOutputUSD: number;
  maxOutputTokens: number;
}

export const MODEL_REGISTRY: Record<SupportedModelId, ModelSpec> = {
  "gemini-3.5-flash-lite": {
    id: "gemini-3.5-flash-lite",
    displayName: "Gemini 3.5 Flash-Lite (Speed & FAQ)",
    defaultThinkingLevel: "minimal",
    pricePerMillionInputUSD: 0.3,
    pricePerMillionOutputUSD: 2.5,
    maxOutputTokens: 8192,
  },
  "gemini-3.6-flash": {
    id: "gemini-3.6-flash",
    displayName: "Gemini 3.6 Flash (Agentic & Booking)",
    defaultThinkingLevel: "medium",
    pricePerMillionInputUSD: 1.5,
    pricePerMillionOutputUSD: 7.5,
    maxOutputTokens: 16384,
  },
  "gemini-3.8-flash": {
    id: "gemini-3.8-flash",
    displayName: "Gemini 3.8 Flash (Sommelier & Omakase Architect)",
    defaultThinkingLevel: "high",
    pricePerMillionInputUSD: 2,
    pricePerMillionOutputUSD: 10,
    maxOutputTokens: 32768,
  },
};

export const MODEL_OPTIONS: Array<{ id: SupportedModelId | "auto"; label: string; hint: string }> = [
  { id: "auto", label: "Авто", hint: "Маршрутизатор сам выбирает 3.5, 3.6 или 3.8" },
  { id: "gemini-3.5-flash-lite", label: "3.5 Flash-Lite", hint: "Короткие вопросы: часы, адрес, дресс-код" },
  { id: "gemini-3.6-flash", label: "3.6 Flash", hint: "Меню, аллергены, бронь и доставка" },
  { id: "gemini-3.8-flash", label: "3.8 Flash", hint: "Сомелье, омакасе, сложные претензии" },
];
