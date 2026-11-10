import { apiClient } from "./api-client";
import type { Patient, PatientPayload } from "@/types/patient";

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
