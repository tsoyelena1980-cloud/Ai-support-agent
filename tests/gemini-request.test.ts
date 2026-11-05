import assert from "node:assert/strict";
import test from "node:test";
import { buildGenerateRequest, sanitizeDebug } from "../src/lib/gemini-transport";

const AQ_KEY = "AQ.Ab8RN6LEVE_demo_key_padding";

test("TC-03 keeps thinkingConfig and drops sampling parameters", () => {
  const request = buildGenerateRequest({
    apiKey: AQ_KEY,
    model: "gemini-3.6-flash",
    thinkingLevel: "medium",
    contents: [{ role: "user", parts: [{ text: "Проверь стол" }] }],
  });
  const debug = sanitizeDebug(request, AQ_KEY);
  assert.equal(request.body.generationConfig.thinkingConfig.thinkingLevel, "medium");
  assert.equal(debug.hasTemperature, false);
  assert.equal(debug.hasTopP, false);
  assert.equal(debug.hasTopK, false);
  assert.equal(debug.hasAuthorization, false);
  assert.equal(debug.keyInQuery, false);
  assert.deepEqual(request.headers, {
    "Content-Type": "application/json",
    "x-goog-api-key": AQ_KEY,
  });
  assert.equal(request.url.includes("?"), false);
  assert.equal(debug.apiKeyHeader.includes(AQ_KEY), false);
  const serialized = JSON.stringify(request.body);
  assert.equal(serialized.includes("temperature"), false);
  assert.equal(serialized.includes(AQ_KEY), false);
});

test("a model turn at the end blocks the request", () => {
  assert.throws(() =>
    buildGenerateRequest({
      apiKey: AQ_KEY,
      model: "gemini-3.5-flash-lite",
      thinkingLevel: "minimal",
      contents: [{ role: "model", parts: [{ text: "уже ответил" }] }],
    }),
  );
});

test("function-call history keeps the original thought signature", () => {
  const signature = "Ev8BCvwB-signature";
  const request = buildGenerateRequest({
    apiKey: AQ_KEY,
    model: "gemini-3.6-flash",
    thinkingLevel: "medium",
    contents: [
      { role: "user", parts: [{ text: "стол" }] },
      {
        role: "model",
        parts: [
          {
            functionCall: { name: "check_table_availability", args: { date: "2026-11-04" } },
            thoughtSignature: signature,
          },
        ],
      },
      { role: "user", parts: [{ functionResponse: { name: "check_table_availability", response: { ok: true } } }] },
    ],
  });
  const modelTurn = request.body.contents[1];
  assert.equal(modelTurn.parts[0].thoughtSignature, signature);
});
