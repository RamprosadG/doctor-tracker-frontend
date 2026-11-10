import type { PaginationParams } from "@/types/pagination";

export type PatientGender = "male" | "female" | "other";

/** The doctor as the patients endpoints attach it: enough to name the owner and
 *  link to them without a second call. `null` is a patient whose doctor record
 *  is gone, which a table shows as "Unassigned" instead of dropping the row. */
export interface PatientDoctorSummary {
  id: string;
  name: string;
  specialization: string;
}

/** The patient as the API returns it. */
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
  doctor: PatientDoctorSummary | null;
  createdAt: string;
  updatedAt: string;
}

/** The body of `POST /patients`; `POST /doctors/:id/patients` takes the same
 *  fields minus `doctorId`, which comes from the path.
 *
 *  `visitDate` is the one field a form may leave out entirely: the server files
 *  the visit as of now, so an empty date input is sent as no key rather than an
 *  empty string, which the API would read as a malformed date. */
export interface PatientPayload {
  name: string;
  phone: string;
  email?: string;
  gender: PatientGender;
  age: number;
  condition: string;
  notes?: string;
  visitDate?: string;
  doctorId: string;
}

/** `POST /doctors/:doctorId/patients`: the same body with the assignment left to
 *  the url, because the page that writes it is already about one doctor. */
export type RosterPatientPayload = Omit<PatientPayload, "doctorId">;

/**
 * Query parameters the patients list endpoint understands. A type alias rather
 * than an interface so a built query can be handed straight to the fetch
 * helpers, which take a plain `Record` of query values.
 */
export type PatientListQuery = PaginationParams & {
  search?: string;
  doctorId?: string;
  condition?: string;
  gender?: PatientGender;
  from?: string;
  to?: string;
  sort?: PatientSort;
};

/** The keys `GET /patients?sort=` accepts; anything else is a 400 at the API. */
export type PatientSort = "-visitDate" | "visitDate" | "-name" | "name";

/** `GET /patients/meta/filters`: stored conditions and bounded doctor options:
 *  the first 20 by name plus the selected `doctorId`, when supplied (at most 21).
 *  Further doctor choices come from the paginated `/doctors/options` endpoint. */
export interface PatientFilterOptions {
  conditions: string[];
  doctors: PatientDoctorSummary[];
}

export const PATIENT_GENDERS: readonly PatientGender[] = [
  "male",
  "female",
  "other",
] as const;

/** The word a table prints and a dropdown offers for a gender — decided once,
 *  so the two faces of a row never disagree. */
export const GENDER_LABELS: Record<PatientGender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const genderOptions = PATIENT_GENDERS.map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

/**
 * Conditions offered as suggestions in the form. The filter dropdown is filled
 * from the API instead: what is actually stored in the practice is a shorter
 * list than what somebody might type. The API stores free text, so a patient
 * can carry a condition not listed here.
 */
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

/** What a table shows where there is no doctor name to print. */
export const UNASSIGNED_DOCTOR_LABEL = "Unassigned";
