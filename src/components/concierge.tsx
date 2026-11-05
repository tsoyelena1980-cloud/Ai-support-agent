"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MODEL_OPTIONS, type SupportedModelId, type ThinkingLevel } from "@/lib/models";
import { formatUsd } from "@/lib/cost";
import { PIN_PATTERN } from "@/lib/key-vault";
import { useAgent } from "@/store/agent-store";
import { useAuth } from "@/store/auth-store";
import { useUi } from "@/store/ui-store";

const THINKING: ThinkingLevel[] = ["minimal", "low", "medium", "high"];

export function Concierge() {
  const open = useUi((state) => state.chatOpen);
  const closeChat = useUi((state) => state.closeChat);
  const debugOpen = useUi((state) => state.debugOpen);
  const setDebugOpen = useUi((state) => state.setDebugOpen);
  const status = useAuth((state) => state.status);
  const errorMessage = useAuth((state) => state.errorMessage);
  const maskedKey = useAuth((state) => state.maskedKey);
  const vaultPresent = useAuth((state) => state.vaultPresent);
  const submitKey = useAuth((state) => state.submitKey);
  const unlockWithPin = useAuth((state) => state.unlockWithPin);
  const forgetKey = useAuth((state) => state.forgetKey);
  const items = useAgent((state) => state.items);
  const mode = useAgent((state) => state.mode);
  const thinkingLevel = useAgent((state) => state.thinkingLevel);
  const setMode = useAgent((state) => state.setMode);
  const setThinkingLevel = useAgent((state) => state.setThinkingLevel);
  const draft = useAgent((state) => state.draft);
  const setDraft = useAgent((state) => state.setDraft);
  const send = useAgent((state) => state.send);
  const sending = useAgent((state) => state.sending);
  const sessionCost = useAgent((state) => state.sessionCost);
  const lastRoute = useAgent((state) => state.lastRoute);
  const lastDebug = useAgent((state) => state.lastDebug);
  const fallbackOffer = useAgent((state) => state.fallbackOffer);
  const fallbackToLite = useAgent((state) => state.fallbackToLite);
  const clearSession = useAgent((state) => state.clearSession);
  const [keyInput, setKeyInput] = useState("");
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [image, setImage] = useState<{ mimeType: string; data: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const drawer = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, transform: "translateX(12%) scale(0.98)" };

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTop = thread.scrollHeight;
  }, [items, sending]);

  async function onSubmitKey(event: React.FormEvent) {
    event.preventDefault();
    await submitKey(keyInput, remember ? pin : undefined);
    if (useAuth.getState().status === "VALID_ACTIVE") setKeyInput("");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={drawer}
          animate={{ opacity: 1, transform: "translateX(0) scale(1)" }}
          exit={drawer}
          transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="concierge fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col overflow-hidden"
          aria-label="Консьерж Кицунэ"
        >
          <header className="flex items-center justify-between border-b border-[var(--border-ember)] px-4 py-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl leading-none">Кицунэ</p>
              <p className="text-xs text-muted">{status === "VALID_ACTIVE" ? maskedKey : "нужен ключ AQ."} · {formatUsd(sessionCost)}</p>
            </div>
            <button type="button" onClick={closeChat} className="text-muted">
              Закрыть
            </button>
          </header>

          {status !== "VALID_ACTIVE" ? (
            <form onSubmit={onSubmitKey} className="space-y-3 border-b border-[var(--border-ember)] p-4">
              <p className="text-sm text-muted">
                Ключ авторизации Google AI Studio остаётся в браузере и уходит только в Google заголовком x-goog-api-key. Старые ключи AIza не принимаются.
              </p>
              <input
                aria-label="Ключ Google AI Studio"
                type="password"
                value={keyInput}
                autoComplete="off"
                placeholder="AQ."
                onChange={(event) => setKeyInput(event.target.value)}
                className="w-full border border-[var(--border-ember)] bg-transparent px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                Запомнить ключ с PIN-кодом
              </label>
              {remember ? (
                <input
                  aria-label="PIN-код"
                  inputMode="numeric"
                  value={pin}
                  placeholder="PIN, 4–8 цифр"
                  onChange={(event) => setPin(event.target.value)}
                  className="w-full border border-[var(--border-ember)] bg-transparent px-3 py-2"
                />
              ) : null}
              <button type="submit" className="bg-cinnabar px-3 py-2 text-sm">
                Проверить ключ
              </button>
              {vaultPresent ? (
                <div className="flex gap-2">
                  <input
                    aria-label="PIN для сейфа"
                    inputMode="numeric"
                    value={unlockPin}
                    placeholder="PIN сейфа"
                    onChange={(event) => setUnlockPin(event.target.value)}
                    className="flex-1 border border-[var(--border-ember)] bg-transparent px-3 py-2"
                  />
                  <button
                    type="button"
                    className="border border-saffron px-3 py-2 text-sm text-saffron"
                    onClick={() => void unlockWithPin(unlockPin)}
                  >
                    Открыть
                  </button>
                </div>
              ) : null}
              {errorMessage ? (
                <p role="alert" className="border border-cinnabar bg-[rgba(230,57,70,0.12)] p-3 text-sm">
                  {errorMessage}
                </p>
              ) : null}
              {status === "LEGACY_AIZA_REJECTED" ? (
                <p className="text-xs uppercase tracking-[0.14em] text-cinnabar">LEGACY_AIZA_REJECTED</p>
              ) : null}
              {remember && pin.length > 0 && !PIN_PATTERN.test(pin) ? (
                <p className="text-xs text-saffron">PIN — только цифры, от 4 до 8.</p>
              ) : null}
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-ember)] px-4 py-2 text-xs text-muted">
              <span>Ключ активен, на сервер ресторана не передаётся.</span>
              <button type="button" onClick={() => forgetKey(false)}>
                Забыть
              </button>
              <button type="button" onClick={() => forgetKey(true)}>
                Стереть сейф
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 border-b border-[var(--border-ember)] p-3 text-sm">
            <label>
              Модель
              <select
                aria-label="Модель Gemini"
                className="mt-1 w-full border border-[var(--border-ember)] bg-obsidian px-2 py-2"
                value={mode}
                onChange={(event) => setMode(event.target.value as SupportedModelId | "auto")}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Рассуждение
              <select
                aria-label="Уровень рассуждения"
                className="mt-1 w-full border border-[var(--border-ember)] bg-obsidian px-2 py-2"
                value={thinkingLevel}
                disabled={mode === "auto"}
                onChange={(event) => setThinkingLevel(event.target.value as ThinkingLevel)}
              >
                {THINKING.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div ref={threadRef} className="thread min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted">Спросите про стол, подбор блюда или его состав. Остальное уйдёт менеджеру зала.</p>
            ) : null}
            {items.map((item) => {
              if (item.type === "user") {
                return (
                  <p key={item.id} className="ml-8 bg-sugiban p-3 text-sm">
                    {item.text}
                    {item.attachment ? <span className="mt-1 block text-xs text-saffron">{item.attachment}</span> : null}
                  </p>
                );
              }
              if (item.type === "assistant") {
                return (
                  <div key={item.id} className="mr-6 border border-[var(--border-ember)] p-3 text-sm whitespace-pre-wrap">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-jade">
                      {item.model} · {item.thinking}
                    </p>
                    {item.text}
                  </div>
                );
              }
              if (item.type === "tool") {
                return (
                  <p key={item.id} className="text-xs text-saffron">
                    {item.name}: {item.summary}
                  </p>
                );
              }
              if (item.type === "handoff") {
                return (
                  <div key={item.id} className="border border-saffron p-3 text-sm">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-saffron">Менеджер зала</p>
                    {item.text}
                  </div>
                );
              }
              if (item.type === "ticket") {
                return (
                  <div key={item.id} className="ticket p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-saffron">Посадочный талон</p>
                    <p className="font-[family-name:var(--font-display)] text-4xl">{item.code}</p>
                    <p className="text-sm">{item.detail}</p>
                  </div>
                );
              }
              return (
                <p key={item.id} role="alert" className="border border-cinnabar p-3 text-sm">
                  {item.text}
                </p>
              );
            })}
            {sending ? <p className="text-sm text-muted">Кицунэ думает…</p> : null}
            {fallbackOffer ? (
              <button type="button" onClick={() => void fallbackToLite()} className="border border-saffron px-3 py-2 text-sm text-saffron">
                Повторить на Gemini 3.5 Flash-Lite
              </button>
            ) : null}
          </div>

          <form
            className="shrink-0 space-y-2 border-t border-[var(--border-ember)] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send({ text: draft, inlineData: image ?? undefined, source: "chat" });
              setImage(null);
            }}
          >
            <textarea
              aria-label="Сообщение Кицунэ"
              value={draft}
              rows={3}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              className="w-full resize-none border border-[var(--border-ember)] bg-transparent px-3 py-2"
              enterKeyHint="send"
              placeholder="Стол у теппаньяки сегодня в 20:00 на двоих"
            />
            <div className="flex items-end justify-between gap-3">
              <label className="min-w-0 flex-1 text-xs text-muted">
                Фото
                <input
                  aria-label="Фото блюда"
                  type="file"
                  accept="image/*"
                  className="block w-full max-w-full text-xs"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1_200_000) {
                      setDraft(`${draft}\n`.trim());
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = String(reader.result ?? "");
                      const match = /^data:(.+);base64,(.+)$/.exec(result);
                      if (match) setImage({ mimeType: match[1], data: match[2] });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <button type="submit" disabled={sending} className="relative z-10 shrink-0 bg-saffron px-4 py-2 text-sm text-obsidian">
                {sending ? "Отправка…" : "Отправить"}
              </button>
            </div>
            {image ? <p className="text-xs text-jade">Фото прикреплено и уйдёт только в Google.</p> : null}
          </form>
          <div className="flex gap-3 px-3 pb-3 text-xs text-muted">
            <button type="button" onClick={() => setDebugOpen(!debugOpen)}>
              {debugOpen ? "Скрыть отладку" : "Отладка запроса"}
            </button>
            <button type="button" onClick={clearSession}>
              Очистить диалог
            </button>
          </div>
          {debugOpen && lastDebug ? (
            <pre className="max-h-48 overflow-auto border-t border-[var(--border-ember)] p-3 text-[11px] text-muted">
              {JSON.stringify(
                {
                  route: lastRoute,
                  url: lastDebug.url,
                  headers: lastDebug.headerNames,
                  apiKey: lastDebug.apiKeyHeader,
                  generationConfig: lastDebug.generationConfig,
                  temperature: lastDebug.hasTemperature,
                  topP: lastDebug.hasTopP,
                  topK: lastDebug.hasTopK,
                  authorization: lastDebug.hasAuthorization,
                  keyInQuery: lastDebug.keyInQuery,
                },
                null,
                2,
              )}
            </pre>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
