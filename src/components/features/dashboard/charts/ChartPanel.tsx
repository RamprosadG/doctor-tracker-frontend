import { useId, type ReactNode } from "react";
import type { NamedCount } from "@/types/dashboard";
import { formatNumber } from "@/lib/utils";

export const CHART_COLORS = ["#4f46e5", "#0284c7", "#0d9488", "#d97706", "#9333ea", "#e11d48", "#475569", "#a3a3a3"];
export const AXIS_STYLE = { fontSize: 11, fill: "#64748b" };
export const TOOLTIP_STYLE = { borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12, maxWidth: 230, whiteSpace: "normal" as const, overflowWrap: "anywhere" as const };
export const shortLabel = (label: string) => label.length > 14 ? `${label.slice(0, 12)}…` : label;

export default function ChartPanel({ title, description, values, children }: { title: string; description: string; values: NamedCount[]; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-xs sm:p-5">
      <h3 id={id} className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
      <div className="mt-5 h-72 min-w-0">{children}</div>
      <details className="mt-3 border-t border-gray-100 pt-1">
        <summary className="flex min-h-11 cursor-pointer items-center rounded text-xs font-medium text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2">View data for {title.toLowerCase()}</summary>
        <dl className="max-h-60 space-y-2 overflow-y-auto py-2 text-xs">
          {values.map((point, index) => (
            <div key={`${point.label}-${index}`} className="flex items-start justify-between gap-3">
              <dt className="min-w-0 break-words">{point.label}</dt>
              <dd className="shrink-0 font-medium tabular-nums text-slate-900">{formatNumber(point.value)}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
