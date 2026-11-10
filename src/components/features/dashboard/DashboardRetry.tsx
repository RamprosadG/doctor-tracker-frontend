"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRetry({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{message}</p>
      <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="min-h-11 rounded-lg px-3 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">
        {pending ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
