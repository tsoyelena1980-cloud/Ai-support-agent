import assert from "node:assert/strict";
import test from "node:test";
import { routeQuery } from "../src/lib/router";

test("omakase widget forces Gemini 3.8 high", () => {
  const route = routeQuery({ text: "привет", hasMedia: false, source: "omakase", mode: "auto" });
  assert.equal(route.model, "gemini-3.8-flash");
  assert.equal(route.thinkingLevel, "high");
});

test("auto router sends complaints and sake to 3.8", () => {
  const route = routeQuery({
    text: "Хочу саке и пейринг к сету",
    hasMedia: false,
    source: "chat",
    mode: "auto",
  });
  assert.equal(route.model, "gemini-3.8-flash");
  assert.equal(route.thinkingLevel, "high");
});

test("auto router sends booking language to 3.6", () => {
  const route = routeQuery({
    text: "Проверь свободный стол",
    hasMedia: false,
    source: "chat",
    mode: "auto",
  });
  assert.equal(route.model, "gemini-3.6-flash");
  assert.equal(route.thinkingLevel, "medium");
});

test("a photo routes to 3.6 even without booking words", () => {
  const route = routeQuery({ text: "что это", hasMedia: true, source: "chat", mode: "auto" });
  assert.equal(route.model, "gemini-3.6-flash");
});

test("plain questions stay on 3.5 flash-lite", () => {
  const route = routeQuery({ text: "Какой у вас адрес?", hasMedia: false, source: "chat", mode: "auto" });
  assert.equal(route.model, "gemini-3.5-flash-lite");
  assert.equal(route.thinkingLevel, "minimal");
});
