import Link from "next/link";
import Badge from "@/components/ui/badges/Badge";
import DataTable, { type Column } from "@/components/ui/tables/DataTable";
import FieldCaption from "@/components/ui/filters/FieldCaption";
import {
  TableActionButton,
} from "@/components/ui/buttons/TableActionButton";
import { formatDate } from "@/lib/utils";
import { GENDER_LABELS, UNASSIGNED_DOCTOR_LABEL, type Patient } from "@/types/patient";
import { IoCreateOutline, IoTrashOutline } from "react-icons/io5";

interface PatientsTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  /** A mutation or revalidation is in flight, so the row buttons wait. */
  isBusy?: boolean;
  emptyMessage?: string;
}

function Actions({
  patient,
  onEdit,
  onDelete,
  isBusy,
}: Required<Omit<PatientsTableProps, "patients" | "emptyMessage">> & { patient: Patient }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <TableActionButton
        tooltip={`Edit ${patient.name}`}
        color="indigo"
        disabled={isBusy}
        onClick={() => onEdit(patient)}
      >
        <IoCreateOutline className="h-4 w-4" />
      </TableActionButton>
      <TableActionButton
        tooltip={`Remove ${patient.name}`}
        color="rose"
        disabled={isBusy}
        onClick={() => onDelete(patient)}
      >
        <IoTrashOutline className="h-4 w-4" />
      </TableActionButton>
    </div>
  );
}

/**
 * One table, two faces: the column set below and `renderCard` carry the same
 * fields in the same order — patient, condition, contact, assigned doctor,
 * visit date, actions — so nothing exists on one width that is missing on the
 * other.
 *
 * The condition is the only badge in a row. Age and gender are a quiet line
 * under the name, because two chips in a cell read as decoration rather than
 * as information.
 */
export default function PatientsTable({
  patients,
  onEdit,
  onDelete,
  isBusy = false,
  emptyMessage = "No patients found.",
}: PatientsTableProps) {
  const columns: Column<Patient>[] = [
    {
      key: "name",
      header: "Patient",
      render: (patient) => (
        <div className="flex flex-col gap-0.5">
          <span className="block max-w-[220px] truncate font-semibold text-slate-900" title={patient.name}>
            {patient.name}
          </span>
          <span className="text-xs text-slate-500">
            {GENDER_LABELS[patient.gender]} · {patient.age}
          </span>
        </div>
      ),
    },
    {
      key: "condition",
      header: "Condition",
      render: (patient) => (
        <Badge variant="info" size="sm">
          {patient.condition}
        </Badge>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (patient) => (
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">{patient.phone}</span>
          {patient.email ? (
            <span className="max-w-[240px] truncate text-xs text-slate-500" title={patient.email}>
              {patient.email}
            </span>
          ) : (
            <span className="text-xs text-slate-400">No email</span>
          )}
        </div>
      ),
    },
    {
      key: "doctor",
      header: "Doctor",
      render: (patient) => <Owner patient={patient} />,
    },
    {
      key: "visitDate",
      header: "Last visit",
      render: (patient) => <span className="text-slate-600">{formatDate(patient.visitDate)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (patient) => (
        <Actions patient={patient} onEdit={onEdit} onDelete={onDelete} isBusy={isBusy} />
      ),
    },
  ];

  return (
    <DataTable<Patient>
      data={patients}
      columns={columns}
      emptyMessage={emptyMessage}
      renderCard={(patient) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900" title={patient.name}>
                {patient.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {GENDER_LABELS[patient.gender]} · {patient.age}
              </p>
              <div className="mt-1.5">
                <Badge variant="info" size="sm">
                  {patient.condition}
                </Badge>
              </div>
            </div>
            <Actions patient={patient} onEdit={onEdit} onDelete={onDelete} isBusy={isBusy} />
          </div>

          <dl className="flex flex-col gap-2 border-t border-slate-200 pt-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Phone</FieldCaption>
              </dt>
              <dd className="truncate text-sm tabular-nums text-slate-700">{patient.phone}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Email</FieldCaption>
              </dt>
              <dd className="min-w-0 truncate text-right text-sm text-slate-700" title={patient.email}>
                {patient.email ?? "No email"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Doctor</FieldCaption>
              </dt>
              <dd className="min-w-0 truncate text-right text-sm">
                <Owner patient={patient} align="right" />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Last visit</FieldCaption>
              </dt>
              <dd className="text-sm text-slate-700">{formatDate(patient.visitDate)}</dd>
            </div>
          </dl>
        </div>
      )}
    />
  );
}

/**
 * The owner is a link, so a row answers "who is looking after this patient?"
 * without a second click elsewhere. The doctors list filtered to that name is
 * the destination the portal has today; the doctor's own page comes with the
 * relation step.
 */
function Owner({ patient, align = "left" }: { patient: Patient; align?: "left" | "right" }) {
  const alignment = align === "right" ? "justify-end text-right" : "";

  if (!patient.doctor) {
    return (
      <span className={`flex flex-col gap-0.5 ${alignment}`}>
        <span className="truncate text-slate-500">{UNASSIGNED_DOCTOR_LABEL}</span>
      </span>
    );
  }

  return (
    <span className={`flex min-w-0 flex-col gap-0.5 ${alignment}`}>
      <Link
        href={`/doctors?search=${encodeURIComponent(patient.doctor.name)}`}
        className="max-w-[220px] truncate font-medium text-indigo-700 underline-offset-2 hover:underline"
        title={patient.doctor.name}
      >
        {patient.doctor.name}
      </Link>
      <span className="max-w-[220px] truncate text-xs text-slate-500">
        {patient.doctor.specialization}
      </span>
    </span>
  );
}
