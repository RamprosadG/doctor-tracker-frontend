import { memo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartPanel, { AXIS_STYLE, TOOLTIP_STYLE, shortLabel } from "./ChartPanel";
import type { NamedCount } from "@/types/dashboard";

export default memo(function PatientsPerDoctorChart({ data }: { data: NamedCount[] }) {
  return (
    <ChartPanel title="Patients per doctor" description="Top eight doctors by patient registrations in this period." values={data}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 30 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickFormatter={shortLabel} interval={0} angle={-35} textAnchor="end" height={64} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#eef2ff" }} />
          <Bar dataKey="value" name="Patients" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={42} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
});
