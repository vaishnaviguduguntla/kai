import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { dataService } from "@/services/data";
import { useCompareStore } from "@/store/compare.store";

const FIELDS: Array<{
  label: string;
  key: string;
  render?: (row: any) => ReactNode;
}> = [
  { label: "CVE", key: "cve" },
  { label: "Severity", key: "severity" },
  { label: "CVSS", key: "cvss" },
  { label: "KAI Status", key: "kaiStatus" },
  { label: "Package", key: "packageName" },
  { label: "Package Version", key: "packageVersion" },
  { label: "Repo", key: "repoName" },
  { label: "Image", key: "imageName" },
  { label: "Image Version", key: "imageVersion" },
  { label: "Published", key: "published" },
  { label: "Fix Date", key: "fixDate" },
  {
    label: "Link",
    key: "link",
    render: (r) =>
      r.link ? (
        <a className="underline" href={r.link} target="_blank" rel="noreferrer">
          Open
        </a>
      ) : (
        "—"
      ),
  },
];

export default function ComparePage() {
  const navigate = useNavigate();
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const { data, isLoading } = useQuery({
    queryKey: ["compare", selectedIds],
    queryFn: () => dataService.getVulnerabilitiesByIds(selectedIds),
    enabled: selectedIds.length > 0,
  });

  if (selectedIds.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xl font-bold text-slate-50">Compare</div>
          <div className="text-sm text-slate-300 mt-2">
            Select multiple vulnerabilities in the list, then come back here to compare them side-by-side.
          </div>
          <div className="mt-4">
            <Link className="underline text-slate-200" to="/vulnerabilities">
              Go to Vulnerabilities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Loading compare…</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-bold text-slate-50">Compare</div>
          <div className="text-sm text-slate-400">Side-by-side view of selected vulnerabilities</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outlined" onClick={clear}>
            Clear all
          </Button>
          <Button variant="outlined" onClick={() => navigate("/vulnerabilities")}>
            Back to list
          </Button>
        </div>
      </div>

      {/* removable chips */}
      <div className="flex flex-wrap gap-2">
        {data.map((v) => (
          <button
            key={v.id}
            className="px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-sm text-slate-100"
            onClick={() => remove(v.id)}
            title="Remove from compare"
          >
            {v.cve} <span className="text-slate-400">×</span>
          </button>
        ))}
      </div>

      <div className="overflow-auto rounded-2xl border border-white/10 bg-white/3">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3 w-56 text-slate-200">Field</th>
              {data.map((v) => (
                <th key={v.id} className="text-left p-3 min-w-[280px] text-slate-200">
                  <div className="font-semibold">{v.cve}</div>
                  <div className="text-xs text-slate-400 truncate">{v.packageName}@{v.packageVersion}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map((f) => (
              <tr key={f.label} className="border-t border-white/10 align-top">
                <td className="p-3 text-slate-400">{f.label}</td>
                {data.map((v) => (
                  <td key={v.id + f.label} className="p-3 text-slate-100">
                    {f.render ? f.render(v as any) : <span className="whitespace-pre-wrap break-words">{(v as any)[f.key] ?? "—"}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
