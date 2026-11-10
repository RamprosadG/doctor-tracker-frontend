import { apiClient } from "./api-client";
import type { Doctor, DoctorPayload } from "@/types/doctor";
import type { PaginatedPayload } from "@/types/api";
import type { DropdownOptionsLoader } from "@/components/ui/dropdowns/Dropdown";

/** A bounded page of name-prefix matches, shared by patient filters and forms. */
export const loadDoctorOptions: DropdownOptionsLoader = async ({ search, page }, signal) => {
  const result = await apiClient.get<PaginatedPayload<Pick<Doctor, "id" | "name" | "specialization">>>(
    "/doctors/options", { page, pageSize: 20, search: search.trim() }, signal,
  );
  return {
    options: result.items.map((doctor) => ({ value: doctor.id, label: doctor.name })),
    hasNextPage: result.meta.hasNextPage,
  };
};

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
