import { create } from "zustand";
import type { Filters } from "@/types/models";

const defaultFilters: Filters = {
  search: "",
  severities: [],
  riskFactors: [],
  hideManualNoRisk: false,
  hideAiNoRisk: false
};

type FilterStore = {
  filters: Filters;
  setSearch: (search: string) => void;
  toggleSeverity: (sev: Filters["severities"][number]) => void;
  setRiskFactors: (factors: string[]) => void;
  toggleHideManual: () => void;
  toggleHideAi: () => void;
  reset: () => void;
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
  toggleSeverity: (sev) =>
    set((s) => {
      const has = s.filters.severities.includes(sev);
      const severities = has
        ? s.filters.severities.filter((x) => x !== sev)
        : [...s.filters.severities, sev];
      return { filters: { ...s.filters, severities } };
    }),
  setRiskFactors: (riskFactors) => set((s) => ({ filters: { ...s.filters, riskFactors } })),
  toggleHideManual: () =>
    set((s) => ({ filters: { ...s.filters, hideManualNoRisk: !s.filters.hideManualNoRisk } })),
  toggleHideAi: () => set((s) => ({ filters: { ...s.filters, hideAiNoRisk: !s.filters.hideAiNoRisk } })),
  reset: () => set({ filters: defaultFilters })
}));
