import { PageHeader } from "@/components/shared/PageHeader";

export default function DashboardPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Totals, patients per doctor and date-based activity for the whole portal."
      />

      <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-slate-500">
        The analytics cards and charts appear here.
      </p>
    </div>
  );
}
