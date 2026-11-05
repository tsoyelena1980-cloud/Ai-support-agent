import type { ToolOutcome } from "@/domain/tools";
import { useRestaurant } from "@/store/restaurant-store";
import { useUi } from "@/store/ui-store";

export function applyToolOutcome(outcome: ToolOutcome): void {
  if (!outcome.ok) return;
  const restaurant = useRestaurant.getState();
  const ui = useUi.getState();
  if (outcome.filter) restaurant.setFilter(outcome.filter, outcome.highlightDishIds ?? []);
  if (outcome.reservations) restaurant.setReservations(outcome.reservations);
  if (outcome.orders) restaurant.setOrders(outcome.orders);
  if (outcome.focusZone) ui.focusHall(outcome.focusZone, outcome.suggestedTableIds ?? []);
  if (outcome.reservedTableId) ui.markReserved(outcome.reservedTableId);
}
