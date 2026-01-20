import { create } from "zustand";

type CompareStore = {
  selectedIds: string[];
  max: number;
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  clear: () => void;
  remove: (id: string) => void;
};

// Global selection used by the Vulnerabilities list and Compare page.
// Keep the selection small so the compare table stays readable.
export const useCompareStore = create<CompareStore>((set, get) => ({
  selectedIds: [],
  max: 6,

  toggle: (id) =>
    set((s) => {
      const exists = s.selectedIds.includes(id);
      if (exists) return { selectedIds: s.selectedIds.filter((x) => x !== id) };
      if (s.selectedIds.length >= s.max) return s;
      return { selectedIds: [...s.selectedIds, id] };
    }),

  isSelected: (id) => get().selectedIds.includes(id),

  clear: () => set({ selectedIds: [] }),

  remove: (id) => set((s) => ({ selectedIds: s.selectedIds.filter((x) => x !== id) })),
}));
