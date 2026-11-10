"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import Pagination from "@/components/ui/pagination/Pagination";
import PatientFormModal from "./PatientFormModal";
import PatientsActions from "./PatientsActions";
import PatientsFilters from "./PatientsFilters";
import PatientsTable from "./PatientsTable";
import { confirmDelete } from "@/components/ui/modals/ConfirmModal";
import { showErrorAlert, showSuccessAlert } from "@/components/ui/alerts/Alerts";
import { deletePatient } from "@/lib/patients-client";
import { apiMessage } from "@/lib/api-client";
import { patientQueryToSearchParams, withFirstPage } from "@/lib/patient-query";
import type { PaginatedPayload } from "@/types/api";
import type { Patient, PatientFilterOptions, PatientListQuery } from "@/types/patient";

interface PatientsViewProps {
  /** The filters the address bar asked for, already clamped to a real page. */
  query: PatientListQuery;
  list: PaginatedPayload<Patient>;
  filterOptions: PatientFilterOptions;
  loadError?: string;
}

/**
 * The patients list, with the address bar as its only state.
 *
 * Filtering writes a URL and the server render answers with the rows for it, so
 * a search is linkable, the back button works, and no second copy of the
 * filters lives in React state. A write does the opposite: it keeps the URL and
 * asks the server to render it again — which is how reassigning a patient to a
 * different doctor moves the count on both rosters without this component
 * knowing either number.
 */
export default function PatientsView({
  query,
  list,
  filterOptions,
  loadError,
}: PatientsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Between a push and the render that answers it, the props still describe the
  // previous URL. Patching from a ref keeps two quick filter changes from
  // discarding the first, and hands the truth back as soon as the server's view
  // of the address bar arrives — including when the user reaches a URL with the
  // browser's own back and forward buttons.
  const pendingQuery = useRef<PatientListQuery | null>(null);
  useEffect(() => {
    pendingQuery.current = null;
  }, [query]);

  const applyQuery = (next: PatientListQuery, keepPosition = false): void => {
    pendingQuery.current = next;

    const search = patientQueryToSearchParams(next).toString();
    const url = search ? `${pathname}?${search}` : pathname;

    startNavigation(() => {
      router.push(url, { scroll: !keepPosition });
    });
  };

  const changeFilters = (patch: Partial<PatientListQuery>): void => {
    applyQuery(withFirstPage(pendingQuery.current ?? query, patch), true);
  };

  const changePage = (page: number): void => {
    applyQuery({ ...(pendingQuery.current ?? query), page });
  };

  const openCreate = (): void => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (patient: Patient): void => {
    setEditing(patient);
    setIsFormOpen(true);
  };

  const handleSaved = (): void => {
    setIsFormOpen(false);
    router.refresh();
  };

  const removePatient = async (patient: Patient): Promise<void> => {
    const isConfirmed = await confirmDelete({
      title: `Remove ${patient.name}?`,
      text: `Their record of ${patient.condition} goes with them.`,
      confirmLabel: "Remove",
    });
    if (!isConfirmed) return;

    setIsMutating(true);
    try {
      const result = await deletePatient(patient.id);
      showSuccessAlert(`${result.name} was removed from the practice.`);
      router.refresh();
    } catch (error) {
      showErrorAlert(apiMessage(error, "The patient could not be removed."));
    } finally {
      setIsMutating(false);
    }
  };

  const { meta } = list;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Patients"
        description="Every patient across the portal, filterable by condition, doctor and visit date."
        actions={<PatientsActions onCreate={openCreate} />}
      />

      <PatientsFilters
        query={query}
        filterOptions={filterOptions}
        onChange={changeFilters}
      />

      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <PatientsTable
        patients={list.items}
        isBusy={isMutating || isNavigating}
        onEdit={openEdit}
        onDelete={removePatient}
      />

      {meta.total > 0 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.pageSize}
          onPageChange={changePage}
        />
      )}

      <PatientFormModal
        isOpen={isFormOpen}
        patient={editing}
        filterOptions={filterOptions}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
