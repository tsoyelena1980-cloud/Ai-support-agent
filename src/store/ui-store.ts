import { create } from "zustand";
import type { DiningZone } from "@/domain/catalog";

interface UiState {
  chatOpen: boolean;
  debugOpen: boolean;
  focusZone: DiningZone | "ANY" | null;
  suggestedTableIds: string[];
  reservedTableIds: string[];
  selectedTableId: string | null;
  openChat: () => void;
  closeChat: () => void;
  setDebugOpen: (value: boolean) => void;
  focusHall: (zone: DiningZone | "ANY", suggestedTableIds: string[]) => void;
  markReserved: (tableId: string) => void;
  selectTable: (tableId: string) => void;
  hydrateReserved: (tableIds: string[]) => void;
}

export const useUi = create<UiState>((set, get) => ({
  chatOpen: false,
  debugOpen: false,
  focusZone: null,
  suggestedTableIds: [],
  reservedTableIds: [],
  selectedTableId: null,
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  setDebugOpen: (debugOpen) => set({ debugOpen }),
  focusHall: (focusZone, suggestedTableIds) => set({ focusZone, suggestedTableIds }),
  markReserved: (tableId) =>
    set({
      reservedTableIds: get().reservedTableIds.includes(tableId)
        ? get().reservedTableIds
        : [...get().reservedTableIds, tableId],
      suggestedTableIds: get().suggestedTableIds.filter((id) => id !== tableId),
      selectedTableId: tableId,
      focusZone: get().focusZone,
    }),
  selectTable: (selectedTableId) => set({ selectedTableId }),
  hydrateReserved: (reservedTableIds) => set({ reservedTableIds }),
}));
