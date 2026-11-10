import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartPanel, { CHART_COLORS, TOOLTIP_STYLE } from "./ChartPanel";
import type { NamedCount } from "@/types/dashboard";

export default memo(function SpecializationShareChart({ data }: { data: NamedCount[] }) {
  const total = useMemo(() => data.reduce((sum, point) => sum + point.value, 0), [data]);
  return (
    <ChartPanel title="Specialization share" description={`${total.toLocaleString("en-US")} registrations by the assigned doctor's specialization. Smaller shares are grouped as Other.`} values={data}>
      <div className="flex h-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="h-40 min-w-0 sm:h-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart accessibilityLayer>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius="48%" outerRadius="78%" paddingAngle={data.length > 1 ? 2 : 0} isAnimationActive={false}>
                {data.map((point, index) => <Cell key={`${point.label}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 text-xs sm:w-1/2 sm:grid-cols-1">
          {data.map((point, index) => (
            <li key={`${point.label}-${index}`} className="flex min-w-0 items-center gap-2" title={`${point.label}: ${point.value}`}>
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="min-w-0 flex-1 truncate text-gray-600">{point.label}</span>
              <span className="shrink-0 font-medium tabular-nums">{total ? Math.round(point.value / total * 100) : 0}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartPanel>
  );
});
