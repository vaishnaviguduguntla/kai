import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filters.store";
import { dataService } from "@/services/data";
import { SEVERITIES, type Severity } from "@/consts/severity";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import styles from "./FilterBar.module.scss";

function severityTone(sev: Severity) {
  if (sev === "critical") return "danger";
  if (sev === "high") return "warning";
  if (sev === "medium") return "info";
  if (sev === "low") return "success";
  return "default";
}

export default function FilterBar() {
  const { filters, setSearch, toggleSeverity, toggleHideAi, toggleHideManual, reset } = useFilterStore();
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const debounced = useDebouncedValue(searchDraft, 150);

  // Keep store in sync (debounced)
  if (debounced !== filters.search) {
    // This is safe because debounced changes slowly. In strict mode it may run twice in dev; acceptable.
    setSearch(debounced);
  }

  const { data } = useQuery({
    queryKey: ["dashboardStats", filters],
    queryFn: () => dataService.getDashboardStats(filters)
  });

  const impact = useMemo(() => {
    const total = data?.totalCount ?? 0;
    const filtered = data?.filteredCount ?? 0;
    const removed = Math.max(0, total - filtered);
    return { total, filtered, removed };
  }, [data]);

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b1220]/70">
      <div className="px-6 py-3 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search CVE / package / repo / image…"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={toggleHideManual}
              className={filters.hideManualNoRisk ? styles.activeGlow : ""}
              variant={filters.hideManualNoRisk ? "contained" : "outlined"}
            >
              Analysis
            </Button>
            <Button
              onClick={toggleHideAi}
              className={filters.hideAiNoRisk ? styles.activeGlow : ""}
              variant={filters.hideAiNoRisk ? "contained" : "outlined"}
            >
              AI Analysis
            </Button>
            <Button onClick={reset} variant="text">
              Reset
            </Button>

            <div className={"ml-0 lg:ml-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 " + styles.pulse}>
              <span className="font-semibold text-slate-50">{impact.filtered.toLocaleString()}</span>
              <span className="text-slate-400"> / </span>
              <span className="text-slate-200">{impact.total.toLocaleString()}</span>
              <span className="text-slate-400"> shown</span>
              <span className="text-slate-400"> · </span>
              <span className="text-slate-300">−{impact.removed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs font-semibold text-slate-400 mr-1">Severity:</div>
          {SEVERITIES.map((sev) => {
            const active = filters.severities.includes(sev);
            return (
              <button
                key={sev}
                type="button"
                onClick={() => toggleSeverity(sev)}
                className={
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition " +
                  (active ? "border-white/20 bg-white/10 text-slate-50" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/8")
                }
              >
                <Chip tone={severityTone(sev)} className="border-0 bg-transparent px-0 py-0">
                  {sev}
                </Chip>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
