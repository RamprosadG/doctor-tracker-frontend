import { memo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartPanel, { AXIS_STYLE, TOOLTIP_STYLE, shortLabel } from "./ChartPanel";
import type { NamedCount } from "@/types/dashboard";

export default memo(function ConditionMixChart({ data }: { data: NamedCount[] }) {
  return (
    <ChartPanel title="Condition mix" description="Top eight conditions recorded for patients registered in this period." values={data}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 4 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={94} tick={AXIS_STYLE} tickFormatter={shortLabel} interval={0} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f0fdfa" }} />
          <Bar dataKey="value" name="Patients" fill="#0d9488" radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
});
