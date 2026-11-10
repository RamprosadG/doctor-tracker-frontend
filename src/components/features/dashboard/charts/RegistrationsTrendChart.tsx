import { memo, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartPanel, { AXIS_STYLE, TOOLTIP_STYLE } from "./ChartPanel";
import type { ChartRange, TrendPoint } from "@/types/dashboard";

export default memo(function RegistrationsTrendChart({ data, range }: { data: TrendPoint[]; range: ChartRange }) {
  const series = useMemo(() => data.map((point) => ({
    ...point,
    label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-US", range === "12m" ? { month: "short", year: "numeric", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" }),
  })), [data, range]);
  return (
    <ChartPanel title="Registration trend" description={range === "12m" ? "Monthly patient registrations, including months with no activity." : "Daily patient registrations, including days with no activity."} values={series}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={series} margin={{ top: 8, right: 14, left: -20, bottom: 8 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={AXIS_STYLE} minTickGap={25} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="linear" dataKey="value" name="Registrations" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
});
