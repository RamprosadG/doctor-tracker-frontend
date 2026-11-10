import { apiGet } from "@/lib/server-api";
import { doctorQueryToApiParams } from "@/lib/doctor-query";
import type { PaginatedPayload } from "@/types/api";
import type { Doctor, DoctorFilterOptions, DoctorListQuery } from "@/types/doctor";

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
