import { MODEL_REGISTRY, type SupportedModelId } from "@/lib/models";

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}

export interface TurnCost {
  model: SupportedModelId;
  promptTokens: number;
  candidateTokens: number;
  thoughtTokens: number;
  usd: number;
}

export function costForTurn(model: SupportedModelId, usage: UsageMetadata | undefined): TurnCost {
  const spec = MODEL_REGISTRY[model];
  const promptTokens = usage?.promptTokenCount ?? 0;
  const candidateTokens = usage?.candidatesTokenCount ?? 0;
  const thoughtTokens = usage?.thoughtsTokenCount ?? 0;
  const usd =
    (promptTokens / 1_000_000) * spec.pricePerMillionInputUSD +
    ((candidateTokens + thoughtTokens) / 1_000_000) * spec.pricePerMillionOutputUSD;

  return { model, promptTokens, candidateTokens, thoughtTokens, usd };
}

export function sumSessionCost(turns: TurnCost[]): number {
  return turns.reduce((total, turn) => total + turn.usd, 0);
}

export function formatUsd(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(5)}`;
  return `$${value.toFixed(4)}`;
}
