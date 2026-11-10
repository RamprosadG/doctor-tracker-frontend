"use client";

import { memo, useMemo } from "react";
import PatientsPerDoctorChart from "./PatientsPerDoctorChart";
import RegistrationsTrendChart from "./RegistrationsTrendChart";
import SpecializationShareChart from "./SpecializationShareChart";
import ConditionMixChart from "./ConditionMixChart";
import type { DashboardCharts as ChartsData } from "@/types/dashboard";

export default memo(function DashboardCharts({ data }: { data: ChartsData }) {
  const total = useMemo(() => data.registrations.reduce((sum, point) => sum + point.value, 0), [data.registrations]);
  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-16 text-center">
        <h3 className="font-semibold text-slate-900">No registrations in this period</h3>
        <p className="mt-2 text-sm text-gray-500">Try a wider date range, or add patients from the Patients page.</p>
      </div>
    );
  }
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <PatientsPerDoctorChart data={data.patientsPerDoctor} />
      <RegistrationsTrendChart data={data.registrations} range={data.range} />
      <SpecializationShareChart data={data.specializationShare} />
      <ConditionMixChart data={data.conditionMix} />
    </div>
  );
});
