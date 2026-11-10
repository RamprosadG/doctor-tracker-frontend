import { apiClient } from "./api-client";
import type { Doctor, DoctorPayload } from "@/types/doctor";

/** What `DELETE /doctors/:id` reports back, including how many patients went
 *  with the record — the confirm dialog promises that number, so it is shown. */
export interface DeleteDoctorResult {
  id: string;
  name: string;
  patientsRemoved: number;
}

export const createDoctor = (body: DoctorPayload): Promise<Doctor> =>
  apiClient.post<Doctor>("/doctors", body);

export const updateDoctor = (id: string, body: Partial<DoctorPayload>): Promise<Doctor> =>
  apiClient.patch<Doctor>(`/doctors/${id}`, body);

export const deleteDoctor = (id: string): Promise<DeleteDoctorResult> =>
  apiClient.delete<DeleteDoctorResult>(`/doctors/${id}`);
