import { Card } from "@/components/ui/Card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { Severity } from "@/consts/severity";

export default function SeverityChart({ data }: { data: Array<{ severity: Severity; count: number }> }) {
  return (
    <Card title="Severity distribution">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="severity" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
