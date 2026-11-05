"use client";

import { useEffect } from "react";
import { RESTAURANT } from "@/domain/catalog";
import { Concierge } from "@/components/concierge";
import { FloorPlan } from "@/components/floor-plan";
import { MenuBoard } from "@/components/menu-board";
import { SiteHeader } from "@/components/site-header";
import { useAgent } from "@/store/agent-store";
import { useRestaurant } from "@/store/restaurant-store";
import { hydrateClientStores } from "@/store/hydrate";

export function HomeExperience() {
  const send = useAgent((state) => state.send);
  const cartIds = useRestaurant((state) => state.cartIds);

  useEffect(() => {
    hydrateClientStores();
  }, []);

  return (
    <div id="top">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-end gap-12 px-4 pt-16 pb-8 md:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-sm text-cinnabar">Москва, Большой Козихинский</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-6xl md:text-8xl">
              Kitsune
              <span className="block">& Ember</span>
            </h1>
            <p className="measure mt-6 text-lg text-ivory/90">
              Паназиатская кухня у угля биночётан: хамачи с трюфельным понзу, сайкё-мисо и лакса, от которой немеет язык.
              Кицунэ сажает за стол и говорит, из чего блюдо.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#hall" className="pressable bg-ivory px-4 py-3 text-sm text-obsidian">
                Смотреть зал
              </a>
              <a href="#menu" className="pressable bg-sugiban px-4 py-3 text-sm shadow-[var(--shadow-surface)]">
                Читать меню
              </a>
            </div>
          </div>
          <div className="glass p-6">
            <p className="text-sm text-muted">Сегодня на робате</p>
            <ul className="mt-5 space-y-3 font-[family-name:var(--font-display)] text-3xl">
              <li>Хамачи и трюфель</li>
              <li>Треска 72 часа</li>
              <li>Чёрный сяолунбао</li>
            </ul>
            <p className="mt-6 text-sm text-muted">
              {RESTAURANT.hours}. Последняя посадка в {RESTAURANT.lastSeating}.
            </p>
          </div>
        </section>

        <MenuBoard />
        <FloorPlan />

        <section id="omakase" className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="text-sm text-saffron">Стол шефа</p>
            <h2 className="font-[family-name:var(--font-display)] text-5xl">Омакасе на четверых</h2>
            <p className="measure mt-4 text-muted">
              Кнопка отправляет запрос в Gemini 3.8 Flash с thinkingLevel high. Бюджет 25 000 ₽, курсы, пейринг и сумма
              считаются инструментами меню, а не фантазией.
            </p>
            <button
              type="button"
              className="mt-6 bg-cinnabar px-4 py-3"
              onClick={() =>
                void send({
                  source: "omakase",
                  text: "Собери дегустационный омакасе-сет на 4 персоны с бюджетом 25000 рублей. Нужны курсы, острота, аллергены, пейринг и итоговая сумма. Используй search_pan_asian_menu и get_sommelier_pairing.",
                })
              }
            >
              Сгенерировать омакасе-сет
            </button>
            {cartIds.length > 0 ? (
              <p className="mt-4 text-sm text-jade">В предзаказе: {cartIds.join(", ")}</p>
            ) : null}
          </div>
          <div id="visit" className="glass p-6">
            <h2 className="font-[family-name:var(--font-display)] text-4xl">Как добраться</h2>
            <p className="mt-4">{RESTAURANT.address}, {RESTAURANT.city}</p>
            <p className="mt-2 text-muted">{RESTAURANT.phone}</p>
            <p className="mt-4 text-sm">{RESTAURANT.dressCode}</p>
            <p className="mt-2 text-sm text-muted">{RESTAURANT.parking}</p>
            <p className="mt-2 text-sm text-muted">{RESTAURANT.delivery}</p>
            <p className="mt-4 text-sm text-muted">
              Доставку, жалобы и всё, что не про стол или меню, Кицунэ передаёт менеджеру зала {RESTAURANT.managerName}: {RESTAURANT.managerPhone}.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--border-ember)] px-4 py-8 text-center text-xs text-muted">
        KITSUNE & EMBER. Ключ AQ. шифруется только если вы сами задали PIN, и никогда не попадает в API ресторана.
      </footer>
      <Concierge />
    </div>
  );
}
