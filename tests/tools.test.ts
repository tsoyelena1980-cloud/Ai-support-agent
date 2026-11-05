import assert from "node:assert/strict";
import test from "node:test";
import { executeTool, initialOrders } from "../src/domain/tools";

const now = new Date("2026-11-03T08:00:00Z");

test("menu search drops peanut dishes and keeps the crab dumpling", () => {
  const outcome = executeTool(
    "search_pan_asian_menu",
    { category: "DIM_SUM_BAO", excluded_allergens: ["peanuts"], max_spice_level: 5 },
    { reservations: [], orders: initialOrders(), now },
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  const ids = (outcome.data.dishes as Array<{ id: string }>).map((dish) => dish.id);
  assert.deepEqual(ids, ["dish-dimsum-03"]);
});

test("teppanyaki for two offers TEP-01 first", () => {
  const outcome = executeTool(
    "check_table_availability",
    { date: "2026-11-03", time: "20:00", guests_count: 2, zone_preference: "Teppanyaki Counter" },
    { reservations: [], orders: initialOrders(), now },
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  const tables = outcome.data.available_tables as Array<{ table_id: string }>;
  assert.equal(tables[0].table_id, "TEP-01");
  assert.equal(outcome.focusZone, "Teppanyaki Counter");
});

test("creating a reservation removes that table from the next check", () => {
  const created = executeTool(
    "create_reservation",
    {
      guest_name: "Алексей",
      guest_phone: "+79990001122",
      date: "2026-11-03",
      time: "20:00",
      guests_count: 2,
      table_id: "TEP-01",
    },
    { reservations: [], orders: initialOrders(), now },
    () => 0,
  );
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.data.reservation_code, "KE-AAAA");
  assert.equal(created.reservedTableId, "TEP-01");
  const again = executeTool(
    "check_table_availability",
    { date: "2026-11-03", time: "20:00", guests_count: 2, zone_preference: "Teppanyaki Counter" },
    { reservations: created.reservations ?? [], orders: initialOrders(), now },
  );
  assert.equal(again.ok, true);
  if (!again.ok) return;
  const ids = (again.data.available_tables as Array<{ table_id: string }>).map((table) => table.table_id);
  assert.equal(ids.includes("TEP-01"), false);
  assert.equal(ids[0], "TEP-02");
});

test("menu search by ingredient returns composition and nothing else", () => {
  const outcome = executeTool(
    "search_pan_asian_menu",
    { category: "ALL", query: "лемонграсс" },
    { reservations: [], orders: initialOrders(), now },
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  const dishes = outcome.data.dishes as Array<{ id: string; ingredients: string[] }>;
  assert.deepEqual(dishes.map((dish) => dish.id), ["dish-laksa-09"]);
  assert.equal(dishes[0].ingredients.includes("лемонграсс"), true);
});

test("unknown dietary tags are rejected", () => {
  const outcome = executeTool(
    "search_pan_asian_menu",
    { category: "ALL", dietary_tags: ["raw"] },
    { reservations: [], orders: initialOrders(), now },
  );
  assert.equal(outcome.ok, false);
});

test("handoff names the floor manager", () => {
  const outcome = executeTool("handoff_to_manager", { topic: "доставка" }, { reservations: [], orders: [], now });
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.equal(outcome.data.manager_phone, "+7 495 120-19-11");
});

test("a late delivery can issue a promo without inventing a refund", () => {
  const outcome = executeTool(
    "track_or_resolve_order_issue",
    { order_id: "KE-2088", issue_type: "LATE_DELIVERY", resolution_action: "ISSUE_PROMO_CODE" },
    { reservations: [], orders: initialOrders(), now },
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.equal(outcome.data.promo_code, "EMBER-2088");
});
