import { Suspense } from "react";
import PatientsContent from "@/components/features/patients/PatientsContent";
import PatientsSkeleton from "@/components/features/patients/PatientsSkeleton";
import type { SearchParamsInput } from "@/lib/utils";

interface PatientsPageProps {
  searchParams: SearchParamsInput;
}

export default function PatientsPage({ searchParams }: PatientsPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<PatientsSkeleton />}>
        <PatientsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
