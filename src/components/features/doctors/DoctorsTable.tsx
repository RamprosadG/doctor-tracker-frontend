import Badge from "@/components/ui/badges/Badge";
import DataTable, { type Column } from "@/components/ui/tables/DataTable";
import FieldCaption from "@/components/ui/filters/FieldCaption";
import {
  TableActionButton,
} from "@/components/ui/buttons/TableActionButton";
import { DOCTOR_BADGE_VARIANT, type Doctor } from "@/types/doctor";
import { formatDate } from "@/lib/utils";
import { IoCreateOutline, IoTrashOutline } from "react-icons/io5";

interface DoctorsTableProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  /** A mutation or revalidation is in flight, so the row buttons wait. */
  isBusy?: boolean;
  emptyMessage?: string;
}

function Actions({ doctor, onEdit, onDelete, isBusy }: Required<Omit<DoctorsTableProps, "doctors" | "emptyMessage">> & { doctor: Doctor }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <TableActionButton
        tooltip={`Edit ${doctor.name}`}
        color="indigo"
        disabled={isBusy}
        onClick={() => onEdit(doctor)}
      >
        <IoCreateOutline className="h-4 w-4" />
      </TableActionButton>
      <TableActionButton
        tooltip={`Remove ${doctor.name}`}
        color="rose"
        disabled={isBusy}
        onClick={() => onDelete(doctor)}
      >
        <IoTrashOutline className="h-4 w-4" />
      </TableActionButton>
    </div>
  );
}

/**
 * One table, two faces: the column set below and `renderCard` carry the same
 * fields in the same order — name, specialization and hospital, contact, the
 * date the doctor was added, roster size, actions — so nothing exists on one
 * width that is missing on the other.
 */
export default function DoctorsTable({
  doctors,
  onEdit,
  onDelete,
  isBusy = false,
  emptyMessage = "No doctors found.",
}: DoctorsTableProps) {
  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      render: (doctor) => (
        <span className="block max-w-[220px] truncate font-semibold text-slate-900" title={doctor.name}>
          {doctor.name}
        </span>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      render: (doctor) => (
        <div className="flex flex-col gap-0.5">
          <span>
            <Badge variant={DOCTOR_BADGE_VARIANT} size="sm">
              {doctor.specialization}
            </Badge>
          </span>
          <span className="max-w-[220px] truncate text-xs text-slate-500" title={doctor.hospital}>
            {doctor.hospital}
          </span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (doctor) => (
        <div className="flex flex-col gap-0.5">
          <span className="tabular-nums">{doctor.phone}</span>
          <span className="max-w-[240px] truncate text-xs text-slate-500" title={doctor.email}>
            {doctor.email}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      render: (doctor) => <span className="text-slate-600">{formatDate(doctor.createdAt)}</span>,
    },
    {
      key: "patientCount",
      header: "Patients",
      render: (doctor) => (
        <span className="tabular-nums text-slate-700">
          {doctor.patientCount ?? 0}
          <span className="ml-1 text-xs text-slate-500">
            {(doctor.patientCount ?? 0) === 1 ? "record" : "records"}
          </span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (doctor) => (
        <Actions doctor={doctor} onEdit={onEdit} onDelete={onDelete} isBusy={isBusy} />
      ),
    },
  ];

  return (
    <DataTable<Doctor>
      data={doctors}
      columns={columns}
      emptyMessage={emptyMessage}
      renderCard={(doctor) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900" title={doctor.name}>
                {doctor.name}
              </p>
              <div className="mt-1.5">
                <Badge variant={DOCTOR_BADGE_VARIANT} size="sm">
                  {doctor.specialization}
                </Badge>
              </div>
              <p className="mt-1 break-words text-xs text-slate-500">{doctor.hospital}</p>
            </div>
            <Actions doctor={doctor} onEdit={onEdit} onDelete={onDelete} isBusy={isBusy} />
          </div>

          <dl className="flex flex-col gap-2 border-t border-slate-200 pt-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Phone</FieldCaption>
              </dt>
              <dd className="truncate text-sm tabular-nums text-slate-700">{doctor.phone}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Email</FieldCaption>
              </dt>
              <dd className="min-w-0 truncate text-right text-sm text-slate-700" title={doctor.email}>
                {doctor.email}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Added</FieldCaption>
              </dt>
              <dd className="text-sm text-slate-700">{formatDate(doctor.createdAt)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt>
                <FieldCaption>Patients</FieldCaption>
              </dt>
              <dd className="text-sm tabular-nums text-slate-700">{doctor.patientCount ?? 0}</dd>
            </div>
          </dl>
        </div>
      )}
    />
  );
}
