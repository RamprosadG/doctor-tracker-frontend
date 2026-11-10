import type { BadgeVariant } from "@/components/ui/badges/Badge";
import type { PaginationParams } from "@/types/pagination";

/** A doctor as the API returns it. `patientCount` is only present where the
 *  endpoint joins it (the list page and the detail header). */
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** The body of `POST /doctors` and `PATCH /doctors/:id`. */
export interface DoctorPayload {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

/** Query parameters the doctors list endpoint understands. */
export interface DoctorListQuery extends PaginationParams {
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
}

/**
 * The filter dropdown and the create/edit suggestions read this list, so a new
 * specialization is added in exactly one place. The API stores free text —
 * these are the values the portal offers, not a constraint it enforces.
 */
export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Nephrology",
  "Neurology",
  "Obstetrics and Gynaecology",
  "Oncology",
  "Orthopaedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];

export const specializationOptions = SPECIALIZATIONS.map((value) => ({
  value,
  label: value,
}));

/** Stable badge colour per specialization, so the same chip looks the same
 *  everywhere it appears. */
export const DOCTOR_BADGE_VARIANT: BadgeVariant = "info";

export const doctorFilterOptions = [
  { value: "", label: "All specializations" },
  ...specializationOptions,
];
