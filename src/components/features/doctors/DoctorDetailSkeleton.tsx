/**
 * The shape of a doctor's page with the words taken out: the way back, the
 * header, the facts row, the filters, the table and the pagination, in the same
 * slots and heights, so the roster arriving does not move anything on screen.
 */
export default function DoctorDetailSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading doctor"
    >
      <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />

      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-52 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-slate-200 py-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid w-full grid-cols-2 gap-3 md:flex md:flex-row md:items-center md:gap-4">
        <div className="h-10 animate-pulse rounded-lg bg-slate-200 md:flex-1" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-200 md:w-40 md:shrink-0" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-200 md:w-40 md:shrink-0" />
      </div>

      <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-200 max-sm:w-full" />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-11 bg-slate-100" />
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 px-5 py-4 ${
                index % 2 === 0 ? "bg-white" : "bg-slate-100"
              }`}
            >
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
    </div>
  );
}
