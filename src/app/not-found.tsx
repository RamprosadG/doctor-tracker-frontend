import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          This page does not exist
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The record or route you followed is not available. It may have been
          removed, or the link may be out of date.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
