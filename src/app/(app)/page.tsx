import { Suspense } from "react";
import DashboardContent from "@/components/features/dashboard/DashboardContent";
import DashboardSkeleton from "@/components/features/dashboard/DashboardSkeleton";
import type { SearchParamsInput } from "@/lib/utils";

export default function DashboardPage({ searchParams }: { searchParams: SearchParamsInput }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
