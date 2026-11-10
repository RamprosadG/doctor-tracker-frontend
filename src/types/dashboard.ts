/**
 * The dashboard contract. The numbers come from database aggregations, so the
 * page renders whatever the API reports instead of deriving totals client-side.
 */
export interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
  averagePatientsPerDoctor: number;
  newPatientsThisMonth: number;
  doctorsWithoutPatients: number;
}

export type ChartRange = "7d" | "30d" | "90d" | "12m";

export interface NamedCount {
  label: string;
  value: number;
}

/** One point on the registrations trend: a day, or a month for the 12-month
 *  range, always labelled the way the axis shows it. */
export interface TrendPoint {
  date: string;
  value: number;
}

export interface DashboardCharts {
  range: ChartRange;
  patientsPerDoctor: NamedCount[];
  registrations: TrendPoint[];
  specializationShare: NamedCount[];
  conditionMix: NamedCount[];
}

export interface RecentActivityEntry {
  id: string;
  patientName: string;
  doctorName: string;
  condition: string;
  visitDate: string;
}

export const CHART_RANGES: readonly { value: ChartRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
] as const;

export const isChartRange = (value: string | undefined): value is ChartRange =>
  CHART_RANGES.some((range) => range.value === value);
