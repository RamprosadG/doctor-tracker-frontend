import { apiGet } from "@/lib/server-api";
import { doctorQueryToApiParams } from "@/lib/doctor-query";
import { patientQueryToApiParams } from "@/lib/patient-query";
import type { PaginatedPayload } from "@/types/api";
import type { Doctor, DoctorFilterOptions, DoctorListQuery } from "@/types/doctor";
import type { Patient, PatientListQuery } from "@/types/patient";

/**
 * Server-side reads for the doctors pages. They run during the render, so the
 * rows are already in the HTML the browser receives — the client never has to
 * fetch a list it is about to paint.
 */
export const fetchDoctorList = (
  query: DoctorListQuery,
): Promise<PaginatedPayload<Doctor>> =>
  apiGet<PaginatedPayload<Doctor>>("/doctors", doctorQueryToApiParams(query));

/** The two `distinct` value lists behind the specialization and hospital dropdowns. */
export const fetchDoctorFilterOptions = (): Promise<DoctorFilterOptions> =>
  apiGet<DoctorFilterOptions>("/doctors/meta/filters");

/**
 * One doctor, with the roster size attached. The detail route answers that
 * number from a count, so a profile header never pays for a list of patients it
 * does not show.
 */
export const fetchDoctorDetail = (id: string): Promise<Doctor> =>
  apiGet<Doctor>(`/doctors/${id}`);

/**
 * The roster under a doctor. A hand-edited address bar can still carry a
 * `doctorId` of its own, and the path wins: this page is about the doctor in its
 * url, so whose patients to show is not a filter it offers.
 */
export const fetchDoctorRoster = (
  doctorId: string,
  query: PatientListQuery,
): Promise<PaginatedPayload<Patient>> =>
  apiGet<PaginatedPayload<Patient>>(
    `/doctors/${doctorId}/patients`,
    patientQueryToApiParams({ ...query, doctorId }),
  );
