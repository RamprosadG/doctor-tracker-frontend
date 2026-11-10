"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import DoctorFormModal from "./DoctorFormModal";
import DoctorsActions from "./DoctorsActions";
import DoctorsFilters from "./DoctorsFilters";
import DoctorsTable from "./DoctorsTable";
import PageHeader from "@/components/shared/PageHeader";
import Pagination from "@/components/ui/pagination/Pagination";
import { confirmDelete } from "@/components/ui/modals/ConfirmModal";
import { showErrorAlert, showSuccessAlert } from "@/components/ui/alerts/Alerts";
import { deleteDoctor } from "@/lib/doctors-client";
import { apiMessage } from "@/lib/api-client";
import {
  doctorQueryToSearchParams,
  withFirstPage,
} from "@/lib/doctor-query";
import type { PaginatedPayload } from "@/types/api";
import type { Doctor, DoctorFilterOptions, DoctorListQuery } from "@/types/doctor";

interface DoctorsViewProps {
  /** The filters the address bar asked for, already clamped to a real page. */
  query: DoctorListQuery;
  list: PaginatedPayload<Doctor>;
  filterOptions: DoctorFilterOptions;
  loadError?: string;
}

/**
 * The doctors list, with the address bar as its only state.
 *
 * Filtering writes a URL and the server render answers with the rows for it, so
 * a search is linkable, the back button works, and no second copy of the
 * filters lives in React state. A write does the opposite: it keeps the URL and
 * asks the server to render it again.
 */
export default function DoctorsView({
  query,
  list,
  filterOptions,
  loadError,
}: DoctorsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Between a push and the render that answers it, the props still describe the
  // previous URL. Patching from a ref keeps two quick filter changes from
  // discarding the first, and hands the truth back as soon as the server's view
  // of the address bar arrives — including when the user reaches a URL with the
  // browser's own back and forward buttons.
  const pendingQuery = useRef<DoctorListQuery | null>(null);
  useEffect(() => {
    pendingQuery.current = null;
  }, [query]);

  const applyQuery = (next: DoctorListQuery, keepPosition = false): void => {
    pendingQuery.current = next;

    const search = doctorQueryToSearchParams(next).toString();
    const url = search ? `${pathname}?${search}` : pathname;

    startNavigation(() => {
      router.push(url, { scroll: !keepPosition });
    });
  };

  const changeFilters = (patch: Partial<DoctorListQuery>): void => {
    applyQuery(withFirstPage(pendingQuery.current ?? query, patch), true);
  };

  const changePage = (page: number): void => {
    applyQuery({ ...(pendingQuery.current ?? query), page });
  };

  const openCreate = (): void => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (doctor: Doctor): void => {
    setEditing(doctor);
    setIsFormOpen(true);
  };

  const handleSaved = (): void => {
    setIsFormOpen(false);
    router.refresh();
  };

  const removeDoctor = async (doctor: Doctor): Promise<void> => {
    const roster = doctor.patientCount ?? 0;

    const isConfirmed = await confirmDelete({
      title: `Remove ${doctor.name}?`,
      text:
        roster > 0
          ? `Their ${roster} patient ${roster === 1 ? "record" : "records"} go with them.`
          : "This doctor has no patients.",
      confirmLabel: "Remove",
    });
    if (!isConfirmed) return;

    setIsMutating(true);
    try {
      const result = await deleteDoctor(doctor.id);
      showSuccessAlert(
        result.patientsRemoved > 0
          ? `${result.name} was removed, along with ${result.patientsRemoved} of their patients.`
          : `${result.name} was removed.`,
      );
      router.refresh();
    } catch (error) {
      showErrorAlert(apiMessage(error, "The doctor could not be removed."));
    } finally {
      setIsMutating(false);
    }
  };

  const { meta } = list;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Doctors"
        description="Search, filter and page through every doctor, then open one to manage its patients."
        actions={<DoctorsActions onCreate={openCreate} />}
      />

      <DoctorsFilters
        query={query}
        filterOptions={filterOptions}
        onChange={changeFilters}
      />

      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <DoctorsTable
        doctors={list.items}
        isBusy={isMutating || isNavigating}
        onEdit={openEdit}
        onDelete={removeDoctor}
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

      <DoctorFormModal
        isOpen={isFormOpen}
        doctor={editing}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
