import { create } from "zustand";
import type { DeliveryOrder, Reservation } from "@/domain/catalog";
import {
  EMPTY_FILTER,
  initialOrders,
  ORDERS_STORAGE_KEY,
  RESERVATIONS_STORAGE_KEY,
  type MenuFilter,
} from "@/domain/tools";

interface RestaurantState {
  filter: MenuFilter;
  highlightedDishIds: string[];
  cartIds: string[];
  reservations: Reservation[];
  orders: DeliveryOrder[];
  setFilter: (filter: MenuFilter, highlightedDishIds?: string[]) => void;
  toggleCart: (dishId: string) => void;
  setReservations: (reservations: Reservation[]) => void;
  setOrders: (orders: DeliveryOrder[]) => void;
  hydrate: (reservations: Reservation[], orders: DeliveryOrder[]) => void;
}

function persistReservations(reservations: Reservation[]) {
  localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
}

function persistOrders(orders: DeliveryOrder[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export const useRestaurant = create<RestaurantState>((set, get) => ({
  filter: EMPTY_FILTER,
  highlightedDishIds: [],
  cartIds: [],
  reservations: [],
  orders: initialOrders(),
  setFilter: (filter, highlightedDishIds = []) => set({ filter, highlightedDishIds }),
  toggleCart: (dishId) => {
    const cartIds = get().cartIds.includes(dishId)
      ? get().cartIds.filter((id) => id !== dishId)
      : [...get().cartIds, dishId];
    set({ cartIds });
  },
  setReservations: (reservations) => {
    persistReservations(reservations);
    set({ reservations });
  },
  setOrders: (orders) => {
    persistOrders(orders);
    set({ orders });
  },
  hydrate: (reservations, orders) => set({ reservations, orders }),
}));
