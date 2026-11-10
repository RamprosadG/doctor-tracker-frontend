import { PageHeader } from "@/components/shared/PageHeader";

export default function PatientsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Patients"
        description="Every patient across the portal, filterable by condition, doctor and visit date."
      />

      <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-slate-500">
        The patients table and its filters appear here.
      </p>
    </div>
  );
}
