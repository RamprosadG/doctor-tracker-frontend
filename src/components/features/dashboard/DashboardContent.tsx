import DashboardView from "./DashboardView";
import { apiPrimaryError } from "@/lib/api-client";
import { apiGet } from "@/lib/server-api";
import { requireUser } from "@/lib/session";
import { toSearchParams, type SearchParamsInput } from "@/lib/utils";
import type { PaginatedPayload } from "@/types/api";
import { isChartRange, type DashboardCharts, type DashboardSummary } from "@/types/dashboard";
import type { Patient } from "@/types/patient";

export default async function DashboardContent({ searchParams }: { searchParams: SearchParamsInput }) {
  await requireUser();
  const rawRange = toSearchParams(await searchParams).get("range") ?? undefined;
  const range = isChartRange(rawRange) ? rawRange : "30d";
  const [summary, charts, activity] = await Promise.allSettled([
    apiGet<DashboardSummary>("/dashboard/summary"),
    apiGet<DashboardCharts>("/dashboard/charts", { range }),
    apiGet<PaginatedPayload<Patient>>("/patients", { page: 1, pageSize: 5, sort: "-visitDate" }),
  ]);

  return (
    <DashboardView
      snapshotKey={crypto.randomUUID()}
      range={range}
      summary={summary.status === "fulfilled" ? summary.value : null}
      summaryError={summary.status === "rejected" ? apiPrimaryError(summary.reason, "Practice totals could not be loaded.") : undefined}
      charts={charts.status === "fulfilled" ? charts.value : null}
      chartsError={charts.status === "rejected" ? apiPrimaryError(charts.reason, "Analytics could not be loaded.") : undefined}
      activity={activity.status === "fulfilled" ? activity.value.items : []}
      activityError={activity.status === "rejected" ? apiPrimaryError(activity.reason, "Recent visits could not be loaded.") : undefined}
    />
  );
}
