import { Suspense } from "react";
import DoctorsContent from "@/components/features/doctors/DoctorsContent";
import DoctorsSkeleton from "@/components/features/doctors/DoctorsSkeleton";
import type { SearchParamsInput } from "@/lib/utils";

interface DoctorsPageProps {
  searchParams: SearchParamsInput;
}

export default function DoctorsPage({ searchParams }: DoctorsPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<DoctorsSkeleton />}>
        <DoctorsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
