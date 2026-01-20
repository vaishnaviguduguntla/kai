import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filters.store";
import { dataService } from "@/services/data";
import KpiRow from "./components/KpiRow";
import SeverityChart from "./components/SeverityChart";
import RiskFactorsChart from "./components/RiskFactorsChart";
import TrendChart from "./components/TrendChart";
import AiManualChart from "./components/AiManualChart";

export default function DashboardPage() {
  const filters = useFilterStore((s) => s.filters);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboardStats", filters],
    queryFn: () => dataService.getDashboardStats(filters)
  });

  if (isLoading) return <div className="p-6">Loading dashboard…</div>;
  if (isError) return <div className="p-6 text-rose-200">Dashboard error: {(error as any)?.message ?? String(error)}</div>;
  if (!data) return <div className="p-6">No data.</div>;

  return (
    <div className="p-6 space-y-6">
      <KpiRow stats={data} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SeverityChart data={data.severityCounts} />
        <RiskFactorsChart data={data.topRiskFactors} />
        <TrendChart data={data.trend} />
        <AiManualChart data={data.kaiBuckets} />
      </div>
    </div>
  );
}
