import assert from "node:assert/strict";
import test from "node:test";
import { costForTurn, sumSessionCost } from "../src/lib/cost";
import { retryDelayMs } from "../src/lib/gemini-transport";

test("turn cost uses prompt price and output price for candidates plus thoughts", () => {
  const turn = costForTurn("gemini-3.6-flash", {
    promptTokenCount: 1_000_000,
    candidatesTokenCount: 500_000,
    thoughtsTokenCount: 500_000,
  });
  assert.equal(turn.usd, 1.5 + 7.5);
});

test("session cost is the sum of turns", () => {
  const first = costForTurn("gemini-3.5-flash-lite", { promptTokenCount: 0, candidatesTokenCount: 0 });
  const second = costForTurn("gemini-3.8-flash", { promptTokenCount: 1_000_000, candidatesTokenCount: 0 });
  assert.equal(sumSessionCost([first, second]), 2);
});

test("retry delay follows the spec backoff", () => {
  assert.equal(retryDelayMs(0, 0), 800);
  assert.equal(retryDelayMs(0, 1), 1050);
  assert.equal(retryDelayMs(1, 0), 1600);
  assert.equal(retryDelayMs(1, 1), 1850);
});
