import { Suspense } from "react";
import DoctorDetailContent from "@/components/features/doctors/DoctorDetailContent";
import DoctorDetailSkeleton from "@/components/features/doctors/DoctorDetailSkeleton";
import type { SearchParamsInput } from "@/lib/utils";

interface DoctorPageProps {
  params: Promise<{ id: string }>;
  searchParams: SearchParamsInput;
}

export default function DoctorPage({ params, searchParams }: DoctorPageProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <Suspense fallback={<DoctorDetailSkeleton />}>
        <DoctorDetailContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
