"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TABLES, ZONE_LABELS, type DiningZone } from "@/domain/catalog";
import { executeTool } from "@/domain/tools";
import { rub } from "@/components/site-header";
import { applyToolOutcome } from "@/store/apply-tool";
import { useRestaurant } from "@/store/restaurant-store";
import { useUi } from "@/store/ui-store";

const ZONES: DiningZone[] = [
  "Main Hall",
  "Teppanyaki Counter",
  "Chef's Omakase Table",
  "VIP Tatami Room",
  "Summer Bamboo Terrace",
];

const ZONE_FRAMES: Record<DiningZone, { x: number; y: number; w: number; h: number }> = {
  "Main Hall": { x: 40, y: 56, w: 330, h: 236 },
  "Teppanyaki Counter": { x: 390, y: 56, w: 350, h: 100 },
  "Chef's Omakase Table": { x: 390, y: 170, w: 350, h: 112 },
  "VIP Tatami Room": { x: 390, y: 298, w: 350, h: 168 },
  "Summer Bamboo Terrace": { x: 40, y: 308, w: 330, h: 158 },
};

export function FloorPlan() {
  const focusZone = useUi((state) => state.focusZone);
  const suggested = useUi((state) => state.suggestedTableIds);
  const reserved = useUi((state) => state.reservedTableIds);
  const selected = useUi((state) => state.selectedTableId);
  const selectTable = useUi((state) => state.selectTable);
  const reservations = useRestaurant((state) => state.reservations);
  const orders = useRestaurant((state) => state.orders);
  const cartIds = useRestaurant((state) => state.cartIds);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [guests, setGuests] = useState(2);
  const [zone, setZone] = useState<DiningZone | "ANY">("Teppanyaki Counter");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    setDate(`${tomorrow.getFullYear()}-${month}-${day}`);
  }, []);

  useEffect(() => {
    if (focusZone) {
      document.getElementById("hall")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusZone, reserved]);

  function snapshot() {
    return { reservations, orders };
  }

  function check() {
    const outcome = executeTool(
      "check_table_availability",
      { date, time, guests_count: guests, zone_preference: zone },
      snapshot(),
    );
    applyToolOutcome(outcome);
    if (!outcome.ok) {
      setNotice(outcome.error);
      return;
    }
    const tables = outcome.data.available_tables as Array<{ table_id: string }>;
    if (tables[0]) selectTable(tables[0].table_id);
    setNotice(tables.length ? `Свободно: ${tables.map((table) => table.table_id).join(", ")}` : "Свободных столов нет.");
  }

  function book() {
    if (!selected) {
      setNotice("Сначала выберите стол на схеме.");
      return;
    }
    const outcome = executeTool(
      "create_reservation",
      {
        guest_name: name,
        guest_phone: phone,
        date,
        time,
        guests_count: guests,
        table_id: selected,
        special_requests: note,
        pre_order_dish_ids: cartIds,
      },
      snapshot(),
    );
    applyToolOutcome(outcome);
    setNotice(outcome.ok ? String(outcome.data.ticket) : outcome.error);
  }

  return (
    <section id="hall" className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-jade">План зала</p>
        <h2 className="font-[family-name:var(--font-display)] text-5xl">Куда сажает Кицунэ</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Нефрит — стол свободен. Шафранная обводка — вариант, который только что проверили. Киноварь — бронь уже держит стол.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="glass overflow-hidden p-3">
          <svg viewBox="0 0 780 490" role="img" aria-label="Схема зала KITSUNE & EMBER" className="h-auto w-full">
            {ZONES.map((zoneName) => {
              const frame = ZONE_FRAMES[zoneName];
              const active = focusZone === zoneName || focusZone === "ANY";
              return (
                <motion.g
                  key={zoneName}
                  animate={{ opacity: focusZone && !active ? 0.45 : 1 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                >
                  <rect
                    x={frame.x}
                    y={frame.y}
                    width={frame.w}
                    height={frame.h}
                    rx="8"
                    fill={focusZone === zoneName ? "rgba(231,176,122,0.1)" : "rgba(255,255,255,0.03)"}
                    stroke={focusZone === zoneName ? "#E7B07A" : "rgba(255,255,255,0.1)"}
                    strokeWidth={focusZone === zoneName ? 2 : 1}
                  />
                  <text x={frame.x + 12} y={frame.y + 22} fill="#A89F94" fontSize="13">
                    {ZONE_LABELS[zoneName]}
                  </text>
                </motion.g>
              );
            })}
            {TABLES.map((table) => {
              const isReserved = reserved.includes(table.id);
              const isSuggested = suggested.includes(table.id);
              const fill = isReserved ? "#E24A32" : "#3D8F78";
              return (
                <g key={table.id} onClick={() => selectTable(table.id)} className="cursor-pointer">
                  <rect
                    x={table.x}
                    y={table.y}
                    width={table.w}
                    height={table.h}
                    rx="6"
                    fill={fill}
                    stroke={selected === table.id || isSuggested ? "#E7B07A" : "rgba(246,241,234,0.35)"}
                    strokeWidth={selected === table.id || isSuggested ? 3 : 1}
                  />
                  <text x={table.x + 8} y={table.y + 22} fill="#F6F1EA" fontSize="12">
                    {table.id} · {table.seats}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <form
          className="glass flex flex-col gap-3 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            book();
          }}
        >
          <h3 className="font-[family-name:var(--font-display)] text-3xl">Проверка без чата</h3>
          <p className="text-sm text-muted">Те же инструменты, что вызывает Кицунэ. Ключ Google для этого не нужен.</p>
          <label className="text-sm text-muted">
            Дата
            <input className="mt-1 w-full border border-[var(--border-ember)] bg-transparent px-2 py-2 text-ivory" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-muted">
              Время
              <input className="mt-1 w-full border border-[var(--border-ember)] bg-transparent px-2 py-2 text-ivory" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
            </label>
            <label className="text-sm text-muted">
              Гости
              <input className="mt-1 w-full border border-[var(--border-ember)] bg-transparent px-2 py-2 text-ivory" type="number" min={1} max={12} value={guests} onChange={(event) => setGuests(Number(event.target.value))} />
            </label>
          </div>
          <label className="text-sm text-muted">
            Зона
            <select className="mt-1 w-full border border-[var(--border-ember)] bg-obsidian px-2 py-2 text-ivory" value={zone} onChange={(event) => setZone(event.target.value as DiningZone | "ANY")}>
              <option value="ANY">Любая</option>
              {ZONES.map((item) => (
                <option key={item} value={item}>
                  {ZONE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={check} className="border border-jade px-3 py-2 text-jade">
            Показать свободные
          </button>
          <label className="text-sm text-muted">
            Имя
            <input className="mt-1 w-full border border-[var(--border-ember)] bg-transparent px-2 py-2 text-ivory" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Телефон
            <input className="mt-1 w-full border border-[var(--border-ember)] bg-transparent px-2 py-2 text-ivory" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 999 000-11-22" />
          </label>
          <label className="text-sm text-muted">
            Пожелания
            <input className="mt-1 w-full border border-[var(--border-ember)] bg-transparent px-2 py-2 text-ivory" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="text-xs text-muted">Стол: {selected ?? "не выбран"}. Предзаказ: {cartIds.length ? cartIds.join(", ") : "пусто"}.</p>
          <button type="submit" className="bg-cinnabar px-3 py-2 text-ivory">
            Забронировать стол
          </button>
          {notice ? <p className="text-sm text-saffron">{notice}</p> : null}
          {reservations[0] ? (
            <div className="ticket p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-saffron">Последний талон</p>
              <p className="font-[family-name:var(--font-display)] text-3xl">{reservations.at(-1)?.code}</p>
              <p>
                {reservations.at(-1)?.guestName}, стол {reservations.at(-1)?.tableId}, {reservations.at(-1)?.date} {reservations.at(-1)?.time}
              </p>
            </div>
          ) : null}
          <p className="text-xs text-muted">Сумма предзаказа не списывается. Цены блюд — в меню, например треска {rub(2900)}.</p>
        </form>
      </div>
    </section>
  );
}
