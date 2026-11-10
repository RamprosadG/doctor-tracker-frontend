export function ChartGridSkeleton() {
  return (
    <div role="status" aria-label="Loading charts" className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 h-64 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" role="status" className="flex w-full min-w-0 flex-col gap-6">
      <div className="h-16 w-full animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}
      </div>
      <ChartGridSkeleton />
    </div>
  );
}
