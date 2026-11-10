"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import Pagination from "@/components/ui/pagination/Pagination";
import DoctorRosterFilters from "./DoctorRosterFilters";
import FieldCaption from "@/components/ui/filters/FieldCaption";
import PatientsActions from "@/components/features/patients/PatientsActions";
import PatientFormModal from "@/components/features/patients/PatientFormModal";
import PatientsTable from "@/components/features/patients/PatientsTable";
import { confirmDelete } from "@/components/ui/modals/ConfirmModal";
import { showErrorAlert, showSuccessAlert } from "@/components/ui/alerts/Alerts";
import { deleteRosterPatient } from "@/lib/patients-client";
import { apiMessage } from "@/lib/api-client";
import { DEFAULT_PATIENT_SORT, hasQueryState, patientQueryToSearchParams, withFirstPage } from "@/lib/patient-query";
import { formatDate } from "@/lib/utils";
import type { PaginatedPayload } from "@/types/api";
import type { Doctor } from "@/types/doctor";
import type { Patient, PatientFilterOptions, PatientListQuery } from "@/types/patient";

interface DoctorDetailViewProps {
  /** The doctor this page is about, with the roster size already counted. */
  doctor: Doctor;
  query: PatientListQuery;
  list: PaginatedPayload<Patient>;
  loadError?: string;
}

/**
 * One doctor's record and their patients, with the roster addressed through the
 * url of the doctor it belongs to.
 *
 * The filters write `/doctors/:id?search=…&page=…` and the server render answers
 * with the rows for it, so a roster page is linkable and the back button works
 * the way the two list pages already do. Writes go through the nested routes,
 * which take the assignment from the path: this component never sends a doctor
 * identifier in a body, so it cannot attach a patient to somebody else or
 * delete a row by guessing another doctor's url.
 */
export default function DoctorDetailView({
  doctor,
  query,
  list,
  loadError,
}: DoctorDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // The same handover as the list pages: between a push and the render that
  // answers it the props still describe the previous url, so patches build from
  // a ref that the server's own read clears.
  const pendingQuery = useRef<PatientListQuery | null>(null);
  useEffect(() => {
    pendingQuery.current = null;
  }, [query]);

  // The dialog asks for the clinic-wide option lists only to name the doctors it
  // can offer. On this page there is one, and it is already in hand.
  const filterOptions = useMemo<PatientFilterOptions>(
    () => ({
      conditions: [],
      doctors: [{ id: doctor.id, name: doctor.name, specialization: doctor.specialization }],
    }),
    [doctor],
  );

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

  const resetFilters = (): void => {
    applyQuery({
      page: 1,
      pageSize: (pendingQuery.current ?? query).pageSize,
      sort: DEFAULT_PATIENT_SORT,
    });
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

  const removeFromRoster = async (patient: Patient): Promise<void> => {
    const isConfirmed = await confirmDelete({
      title: `Remove ${patient.name}?`,
      text: `Their record of ${patient.condition} goes with them; ${doctor.name} keeps the rest of the list.`,
      confirmLabel: "Remove",
    });
    if (!isConfirmed) return;

    setIsMutating(true);
    try {
      const result = await deleteRosterPatient(doctor.id, patient.id);
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
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href="/doctors"
          className="font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          Doctors
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-600">{doctor.name}</span>
      </nav>

      {/* The order the rows are in belongs to the sort control below, which the
          reader can change; claiming it here would leave the header contradicting
          the address bar after a sort. */}
      <PageHeader
        title={doctor.name}
        description={`${doctor.specialization} at ${doctor.hospital}. ${
          doctor.patientCount ?? 0
        } ${doctor.patientCount === 1 ? "patient" : "patients"} on this list.`}
        actions={<PatientsActions onCreate={openCreate} />}
      />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-slate-200 py-4 max-sm:grid-cols-2 sm:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-1">
          <dt>
            <FieldCaption>Phone</FieldCaption>
          </dt>
          <dd className="truncate text-sm text-slate-700">{doctor.phone}</dd>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <dt>
            <FieldCaption>Email</FieldCaption>
          </dt>
          <dd className="truncate text-sm text-slate-700" title={doctor.email}>
            {doctor.email}
          </dd>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <dt>
            <FieldCaption>Hospital</FieldCaption>
          </dt>
          <dd className="truncate text-sm text-slate-700" title={doctor.hospital}>
            {doctor.hospital}
          </dd>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <dt>
            <FieldCaption>Joined</FieldCaption>
          </dt>
          <dd className="truncate text-sm tabular-nums text-slate-700">
            {formatDate(doctor.createdAt)}
          </dd>
        </div>
      </dl>

      <DoctorRosterFilters query={query} onChange={changeFilters} onReset={resetFilters} />

      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <PatientsTable
        patients={list.items}
        isBusy={isMutating || isNavigating}
        onEdit={openEdit}
        onDelete={removeFromRoster}
        emptyMessage={
          hasQueryState(query)
            ? "No patients on this list match these filters."
            : `${doctor.name} has no patients on this list yet.`
        }
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
        rosterDoctorId={doctor.id}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
