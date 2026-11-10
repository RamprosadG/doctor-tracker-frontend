import { PageHeader } from "@/components/shared/PageHeader";

export default function DoctorsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Doctors"
        description="Search, filter and page through every doctor, then open one to manage its patients."
      />

      <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-slate-500">
        The doctors table and its filters appear here.
      </p>
    </div>
  );
}
