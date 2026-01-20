import React, { useCallback } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import type { VulnListItem } from "@/types/models";
import { Chip } from "@/components/ui/Chip";
import { useCompareStore } from "@/store/compare.store";

function toneForSeverity(sev: string) {
  if (sev === "critical") return "danger";
  if (sev === "high") return "warning";
  if (sev === "medium") return "info";
  if (sev === "low") return "success";
  return "default";
}

type RowData = {
  rows: VulnListItem[];
  onOpen: (id: string) => void;
};

const Row = React.memo(function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const r = data.rows[index];

  const isSelected = useCompareStore((s) => s.isSelected(r.id));
  const toggle = useCompareStore((s) => s.toggle);
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const max = useCompareStore((s) => s.max);
  const disableCheck = !isSelected && selectedIds.length >= max;

  return (
    <div style={style} className="px-3">
      <button
        type="button"
        onClick={() => data.onOpen(r.id)}
        className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition px-3 py-2"
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              disabled={disableCheck}
              onChange={() => toggle(r.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 accent-white disabled:opacity-40"
              title={disableCheck ? `Max ${max} selected` : "Select to compare"}
              aria-label="Select vulnerability to compare"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-slate-50 truncate">{r.cve}</div>
              <Chip tone={toneForSeverity(r.severity) as any}>{r.severity}</Chip>
              {r.kaiStatus ? <Chip>{r.kaiStatus}</Chip> : null}
            </div>
            <div className="text-xs text-slate-400 truncate mt-1">
              {r.packageName}@{r.packageVersion} · {r.repoName} · {r.imageVersion}
            </div>
          </div>

          <div className="shrink-0 text-right ml-auto">
            <div className="text-sm font-semibold text-slate-100">CVSS {r.cvss ?? "—"}</div>
            <div className="text-xs text-slate-400">{r.published?.slice(0, 10) ?? "—"}</div>
          </div>
        </div>
      </button>
    </div>
  );
});

export default function VulnTable({ rows, height, onOpen }: { rows: VulnListItem[]; height: number; onOpen: (id: string) => void }) {
  const itemKey = useCallback((index: number, data: RowData) => data.rows[index].id, []);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
      <div className="px-4 py-3 text-sm font-semibold text-slate-100 border-b border-white/10">Vulnerabilities</div>
      <List
        height={height}
        width="100%"
        itemCount={rows.length}
        itemSize={76}
        itemKey={itemKey}
        itemData={{ rows, onOpen }}
      >
        {Row}
      </List>
    </div>
  );
}
