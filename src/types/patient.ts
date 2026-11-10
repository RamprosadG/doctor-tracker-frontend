import type { BadgeVariant } from "@/components/ui/badges/Badge";
import type { Doctor } from "@/types/doctor";
import type { PaginationParams } from "@/types/pagination";

export type PatientGender = "male" | "female" | "other";

/** The patient as the API returns it. `doctor` is the trimmed summary joined
 *  onto list rows so a table can show and link the owner without a second call. */
export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender: PatientGender;
  age: number;
  condition: string;
  notes?: string;
  visitDate: string;
  doctorId: string;
  doctor?: Pick<Doctor, "id" | "name" | "specialization">;
  createdAt: string;
  updatedAt: string;
}

/** The body of `POST /patients`; `POST /doctors/:id/patients` takes the same
 *  fields minus `doctorId`, which comes from the path. */
export interface PatientPayload {
  name: string;
  phone: string;
  email?: string;
  gender: PatientGender;
  age: number;
  condition: string;
  notes?: string;
  visitDate: string;
  doctorId: string;
}

/** Query parameters the patients list endpoint understands. */
export interface PatientListQuery extends PaginationParams {
  search?: string;
  doctorId?: string;
  condition?: string;
  gender?: PatientGender;
  from?: string;
  to?: string;
}

export const PATIENT_GENDERS: readonly PatientGender[] = [
  "male",
  "female",
  "other",
] as const;

export const genderOptions = PATIENT_GENDERS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

/** Conditions offered as suggestions in the form and the filter dropdown. The
 *  API stores free text, so a patient can carry a condition not listed here. */
export const COMMON_CONDITIONS = [
  "Acute respiratory infection",
  "Anemia in pregnancy",
  "Asthma",
  "Chronic kidney disease",
  "COPD",
  "Coronary artery disease",
  "Diabetes type 2",
  "Eczema",
  "GERD",
  "Hypertension",
  "Hypothyroidism",
  "Insomnia",
  "Knee osteoarthritis",
  "Lower back pain",
  "Migraine",
  "Major depression",
  "PCOS",
  "Psoriasis",
  "Urinary tract infection",
] as const;

export const conditionFilterOptions = [
  { value: "", label: "All conditions" },
  ...COMMON_CONDITIONS.map((value) => ({ value, label: value })),
];

/** One place decides how a gender chip looks, on both faces of every table. */
export const GENDER_BADGE_VARIANTS: Record<PatientGender, BadgeVariant> = {
  male: "info",
  female: "success",
  other: "neutral",
};
