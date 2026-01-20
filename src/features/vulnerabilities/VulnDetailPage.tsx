import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filters.store";
import { dataService } from "@/services/data";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export default function VulnDetailPage() {
  const { id } = useParams();
  const filters = useFilterStore((s) => s.filters);

  const { data } = useQuery({
    queryKey: ["vulnDetail", id, filters],
    queryFn: async () => {
      // For the starter, reuse list query and find by id.
      const res = await dataService.getVulnerabilities({ filters, sortKey: "published", page: 0, pageSize: 200 });
      return res.rows.find((r) => r.id === id) ?? null;
    }
  });

  if (!id) return <div className="p-6">Missing id.</div>;
  if (!data) return <div className="p-6">Not found (starter dataset is tiny).</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-bold text-slate-50">{data.cve}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <Chip>{data.severity}</Chip>
        <Chip>CVSS {data.cvss ?? "—"}</Chip>
        {data.kaiStatus ? <Chip>{data.kaiStatus}</Chip> : null}
      </div>

      <Card title="Context">
        <div className="text-sm text-slate-200">{data.groupName} · {data.repoName}</div>
        <div className="text-sm text-slate-400 mt-1">{data.imageName}</div>
      </Card>

      <Card title="Package">
        <div className="text-sm text-slate-200">{data.packageName}@{data.packageVersion}</div>
      </Card>

      <Card title="Dates">
        <div className="text-sm text-slate-200">Published: {data.published}</div>
        <div className="text-sm text-slate-200 mt-1">Fix date: {data.fixDate}</div>
      </Card>

      <Card title="Link">
        <a className="text-sky-200 hover:underline" href={data.link} target="_blank" rel="noreferrer">
          Open in NVD
        </a>
      </Card>
    </div>
  );
}
