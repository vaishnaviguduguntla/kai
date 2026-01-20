import { Card } from "@/components/ui/Card";
import type { DashboardStats } from "@/types/models";

export default function KpiRow({ stats }: { stats: DashboardStats }) {
  const removed = Math.max(0, stats.totalCount - stats.filteredCount);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title="Visible vulnerabilities">
        <div className="text-3xl font-bold">{stats.filteredCount.toLocaleString()}</div>
        <div className="text-sm text-slate-400">After filters</div>
      </Card>
      <Card title="Total vulnerabilities">
        <div className="text-3xl font-bold">{stats.totalCount.toLocaleString()}</div>
        <div className="text-sm text-slate-400">In dataset (current source)</div>
      </Card>
      <Card title="Removed by filters">
        <div className="text-3xl font-bold">{removed.toLocaleString()}</div>
        <div className="text-sm text-slate-400">kaiStatus toggles + severity/search</div>
      </Card>
    </div>
  );
}
