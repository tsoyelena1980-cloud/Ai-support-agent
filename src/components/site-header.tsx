"use client";

import { MENU } from "@/domain/catalog";
import { formatUsd } from "@/lib/cost";
import { useAgent } from "@/store/agent-store";
import { useAuth } from "@/store/auth-store";
import { useRestaurant } from "@/store/restaurant-store";
import { useUi } from "@/store/ui-store";

export function rub(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function SiteHeader() {
  const maskedKey = useAuth((state) => state.maskedKey);
  const status = useAuth((state) => state.status);
  const cartCount = useRestaurant((state) => state.cartIds.length);
  const sessionCost = useAgent((state) => state.sessionCost);
  const chatOpen = useUi((state) => state.chatOpen);
  const openChat = useUi((state) => state.openChat);

  return (
    <>
      <header className="topbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="#top" className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide">KITSUNE</span>
            <span className="text-xs uppercase tracking-[0.28em] text-saffron">Ember</span>
          </a>
          <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
            <a href="#menu">Меню</a>
            <a href="#hall">Зал</a>
            <a href="#omakase">Омакасе</a>
            <a href="#visit">Визит</a>
          </nav>
          <span className="tabular hidden text-xs text-muted sm:inline">
            {status === "VALID_ACTIVE" ? maskedKey : "ключ не активен"} · предзаказ {cartCount} · {formatUsd(sessionCost)}
          </span>
        </div>
      </header>
      {chatOpen ? null : (
        <button
          type="button"
          onClick={openChat}
          aria-label="Открыть чат"
          className="chat-launcher bg-cinnabar px-5 py-3 text-sm text-ivory shadow-2xl"
        >
          Чат
        </button>
      )}
    </>
  );
}

export function dishById(id: string) {
  return MENU.find((dish) => dish.id === id);
}
