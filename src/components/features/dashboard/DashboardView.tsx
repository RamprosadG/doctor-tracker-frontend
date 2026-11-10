import Link from "next/link";
import { FiActivity, FiCalendar, FiUsers, FiUserPlus } from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/ui/stats/StatCard";
import DashboardAnalytics from "./DashboardAnalytics";
import DashboardRetry from "./DashboardRetry";
import { formatNumber } from "@/lib/utils";
import type { ChartRange, DashboardCharts, DashboardSummary } from "@/types/dashboard";
import type { Patient } from "@/types/patient";

interface DashboardViewProps {
  snapshotKey: string;
  range: ChartRange;
  summary: DashboardSummary | null;
  summaryError?: string;
  charts: DashboardCharts | null;
  chartsError?: string;
  activity: Patient[];
  activityError?: string;
}

export default function DashboardView({ snapshotKey, range, summary, summaryError, charts, chartsError, activity, activityError }: DashboardViewProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader title="Dashboard" description="A clear view of your practice, patients and registration activity." />
      <section aria-label="Practice totals" className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Whole practice · all time</p>
        {summaryError ? <DashboardRetry message={summaryError} /> : summary && (
          <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard title="Total doctors" value={formatNumber(summary.totalDoctors)} subtitle={`${formatNumber(summary.doctorsWithoutPatients)} without patients`} icon={<FiUserPlus />} />
            <StatCard title="Total patients" value={formatNumber(summary.totalPatients)} subtitle="Across all doctors" icon={<FiUsers />} iconBgColor="bg-sky-50" iconColor="text-sky-600" />
            <StatCard title="Patients per doctor" value={formatNumber(summary.averagePatientsPerDoctor)} subtitle="Practice-wide average" icon={<FiActivity />} iconBgColor="bg-emerald-50" iconColor="text-emerald-600" />
            <StatCard title="New this month" value={formatNumber(summary.newPatientsThisMonth)} subtitle="Patient registrations · UTC" icon={<FiCalendar />} iconBgColor="bg-amber-50" iconColor="text-amber-600" />
          </div>
        )}
      </section>
      <DashboardAnalytics key={snapshotKey} initialRange={range} initialCharts={charts} initialError={chartsError} />
      <section aria-labelledby="recent-visits-title" className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div>
            <h2 id="recent-visits-title" className="font-semibold text-slate-900">Recent visits</h2>
            <p className="mt-1 text-xs text-gray-500">Latest five visit records, independent of the chart range.</p>
          </div>
          <Link href="/patients" className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-indigo-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">View all patients</Link>
        </div>
        {activityError ? <div className="p-4"><DashboardRetry message={activityError} /></div> : activity.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">No patient visits yet. Add a patient to get started.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activity.map((patient) => (
              <li key={patient.id} className="flex min-w-0 flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900" title={patient.name}>{patient.name}</p>
                  <p className="mt-1 truncate text-xs text-gray-500" title={patient.condition}>{patient.condition}</p>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-4 sm:w-1/2">
                  {patient.doctor ? <Link href={`/doctors/${patient.doctor.id}`} title={patient.doctor.name} className="inline-flex min-h-11 min-w-0 items-center rounded text-sm text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"><span className="truncate">{patient.doctor.name}</span></Link> : <span className="text-sm text-gray-500">Unassigned</span>}
                  <time dateTime={patient.visitDate} className="shrink-0 text-xs text-gray-500">{new Date(patient.visitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
