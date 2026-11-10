import { apiGet } from "@/lib/server-api";
import { patientQueryToApiParams } from "@/lib/patient-query";
import type { PaginatedPayload } from "@/types/api";
import type { Patient, PatientFilterOptions, PatientListQuery } from "@/types/patient";

/**
 * Server-side reads for the patients pages. They run during the render, so the
 * rows are already in the HTML the browser receives — the client never has to
 * fetch a list it is about to paint.
 */
export const fetchPatientList = (
  query: PatientListQuery,
): Promise<PaginatedPayload<Patient>> =>
  apiGet<PaginatedPayload<Patient>>("/patients", patientQueryToApiParams(query));

/** The distinct conditions and the assignable doctors behind the two dropdowns. */
export const fetchPatientFilterOptions = (): Promise<PatientFilterOptions> =>
  apiGet<PatientFilterOptions>("/patients/meta/filters");
