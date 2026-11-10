"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChartGridSkeleton } from "./DashboardSkeleton";
import { apiClient, apiPrimaryError } from "@/lib/api-client";
import { CHART_RANGES, isChartRange, type ChartRange, type DashboardCharts } from "@/types/dashboard";

const Charts = dynamic(() => import("./charts/DashboardCharts"), { ssr: false, loading: ChartGridSkeleton });

interface DashboardAnalyticsProps {
  initialRange: ChartRange;
  initialCharts: DashboardCharts | null;
  initialError?: string;
}

export default function DashboardAnalytics({ initialRange, initialCharts, initialError }: DashboardAnalyticsProps) {
  const searchParams = useSearchParams();
  const rawRange = searchParams.get("range") ?? undefined;
  const range = isChartRange(rawRange) ? rawRange : "30d";
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ range: initialRange, charts: initialCharts, error: initialError, attempt: 0 });
  const hasRequested = useRef(false);
  const pending = result.range !== range || result.attempt !== attempt;

  useEffect(() => {
    if (!hasRequested.current && range === initialRange && attempt === 0) return;
    hasRequested.current = true;
    const controller = new AbortController();
    apiClient.get<DashboardCharts>("/dashboard/charts", { range }, controller.signal).then(
      (charts) => {
        if (!controller.signal.aborted) setResult({ range, charts, error: undefined, attempt });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ range, charts: null, error: apiPrimaryError(error, "Analytics could not be loaded."), attempt });
      },
    );
    return () => controller.abort();
  }, [range, initialRange, attempt]);

  function changeRange(next: ChartRange) {
    if (next === range) return;
    // Native history changes the chart URL without rerunning the unfiltered server reads.
    const url = new URL(window.location.href);
    url.searchParams.set("range", next);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <section aria-labelledby="analytics-title" className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 id="analytics-title" className="text-lg font-semibold text-slate-900">Patient analytics</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">Patient registrations in the selected period · UTC calendar dates.</p>
        </div>
        <div role="group" aria-label="Chart date range" className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-white p-1 sm:flex">
          {CHART_RANGES.map((option) => (
            <button key={option.value} type="button" aria-pressed={range === option.value} onClick={() => changeRange(option.value)} className={`min-h-11 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${range === option.value ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p role="status" className="text-xs text-gray-500">{pending ? "Updating charts… Previous results remain visible." : `Showing ${CHART_RANGES.find((option) => option.value === range)?.label.toLowerCase()}. Practice totals are unchanged.`}</p>
      {!pending && result.error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{result.error}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="min-h-11 rounded-lg px-3 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Retry charts</button>
        </div>
      )}
      <div aria-busy={pending} className={pending ? "opacity-60" : undefined}>
        {result.charts ? <Charts data={result.charts} /> : pending ? <ChartGridSkeleton /> : null}
      </div>
    </section>
  );
}
