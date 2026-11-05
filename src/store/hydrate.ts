import { ORDERS_STORAGE_KEY, RESERVATIONS_STORAGE_KEY } from "@/domain/tools";
import type { DeliveryOrder, Reservation } from "@/domain/catalog";
import { initialOrders } from "@/domain/tools";
import { VAULT_STORAGE_KEY } from "@/lib/key-vault";
import { useAuth } from "@/store/auth-store";
import { useRestaurant } from "@/store/restaurant-store";
import { useUi } from "@/store/ui-store";

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export function hydrateClientStores(): void {
  useAuth.getState().setVaultPresent(Boolean(localStorage.getItem(VAULT_STORAGE_KEY)));
  const reservations = readJson<Reservation[]>(RESERVATIONS_STORAGE_KEY) ?? [];
  const orders = readJson<DeliveryOrder[]>(ORDERS_STORAGE_KEY) ?? initialOrders();
  useRestaurant.getState().hydrate(reservations, orders);
  useUi.getState().hydrateReserved(reservations.map((item) => item.tableId));
}
