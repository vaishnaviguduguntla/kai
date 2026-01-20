import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filters.store";
import { dataService } from "@/services/data";
import type { SortKey } from "@/types/models";
import VulnTable from "./components/VulnTable";
import { Button } from "@/components/ui/Button";
import CompareTray from "./components/CompareTray";

export default function VulnerabilitiesPage() {
  const navigate = useNavigate();
  const filters = useFilterStore((s) => s.filters);
  const [sortKey, setSortKey] = useState<SortKey>("published");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const queryKey = useMemo(() => ["vulnList", filters, sortKey, page, pageSize] as const, [filters, sortKey, page, pageSize]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => dataService.getVulnerabilities({ filters, sortKey, page, pageSize })
  });

  const rows = data?.rows ?? [];
  const total = data?.totalFiltered ?? 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-bold text-slate-50">Vulnerabilities</div>
          <div className="text-sm text-slate-400">Filtered: {total.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Tip: select up to 6 rows to compare.</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400">Sort</div>
          <select
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as SortKey);
              setPage(0);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="published">Published</option>
            <option value="cvss">CVSS</option>
            <option value="severity">Severity</option>
          </select>
          <Button
            variant="outlined"
            onClick={() => {
              // export current page for now; swap to export all filtered when DB worker is wired
              import("@/utils/export").then(({ exportToCsv }) => exportToCsv(rows, "vulns-page.csv"));
            }}
          >
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Loading vulnerabilities…</div>
      ) : isError ? (
        <div className="rounded-2xl border border-white/10 bg-rose-950/30 p-6 text-rose-200">
          Vulnerabilities error: {(error as any)?.message ?? String(error)}
        </div>
      ) : (
        <VulnTable rows={rows} height={560} onOpen={(id) => navigate(`/vulnerabilities/${encodeURIComponent(id)}`)} />
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">Page {page + 1}</div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Prev
          </Button>
          <Button
            variant="outlined"
            disabled={(page + 1) * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <CompareTray />
    </div>
  );
}
