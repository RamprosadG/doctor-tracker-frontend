import { apiClient } from "./api-client";
import type { Patient, PatientPayload, RosterPatientPayload } from "@/types/patient";

/** What `DELETE /patients/:id` reports back. Removing a patient cannot touch
 *  any other row, so the name is all there is to say. */
export interface DeletePatientResult {
  id: string;
  name: string;
}

export const createPatient = (body: PatientPayload): Promise<Patient> =>
  apiClient.post<Patient>("/patients", body);

export const updatePatient = (id: string, body: Partial<PatientPayload>): Promise<Patient> =>
  apiClient.patch<Patient>(`/patients/${id}`, body);

export const deletePatient = (id: string): Promise<DeletePatientResult> =>
  apiClient.delete<DeletePatientResult>(`/patients/${id}`);

/**
 * The nested create takes no `doctorId`: the url names the doctor, and the
 * server ignores anything the body claims about it, so a patient cannot be
 * attached to somebody the page does not show.
 */
export const createRosterPatient = (
  doctorId: string,
  body: RosterPatientPayload,
): Promise<Patient> => apiClient.post<Patient>(`/doctors/${doctorId}/patients`, body);

/** Removing one row needs both ids to agree, which is why the roster page asks
 *  for the pair rather than deleting by patient id alone. */
export const deleteRosterPatient = (
  doctorId: string,
  patientId: string,
): Promise<DeletePatientResult> =>
  apiClient.delete<DeletePatientResult>(`/doctors/${doctorId}/patients/${patientId}`);
