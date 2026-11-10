import DoctorsView from "./DoctorsView";
import { apiMessage } from "@/lib/api-client";
import { readDoctorQuery } from "@/lib/doctor-query";
import { fetchDoctorFilterOptions, fetchDoctorList } from "@/lib/doctors-server";
import { buildPaginationMeta, toSearchParams, type SearchParamsInput } from "@/lib/utils";
import type { PaginatedPayload } from "@/types/api";
import type {
  Doctor,
  DoctorFilterOptions,
  DoctorListQuery,
} from "@/types/doctor";

interface DoctorsContentProps {
  searchParams: SearchParamsInput;
}

interface DoctorsRead {
  list: PaginatedPayload<Doctor>;
  filterOptions: DoctorFilterOptions;
  /** The query the view should treat as current, with the page the API actually served. */
  effectiveQuery: DoctorListQuery;
  loadError?: string;
}

const NO_OPTIONS: DoctorFilterOptions = { specializations: [], hospitals: [] };

/**
 * Both reads belong to the render, so a failure is answered here rather than
 * thrown at the viewer: the filters, the empty table and the reason the rows
 * did not arrive still make a usable page.
 */
async function readDoctors(query: DoctorListQuery): Promise<DoctorsRead> {
  try {
    const [list, filterOptions] = await Promise.all([
      fetchDoctorList(query),
      fetchDoctorFilterOptions(),
    ]);

    // The API clamps a page beyond the last one, and the view has to push the
    // page it actually showed — otherwise a delete that shrinks the result set
    // would leave the address bar asking for a page that no longer exists.
    return {
      list,
      filterOptions,
      effectiveQuery: { ...query, page: list.meta.page, pageSize: list.meta.pageSize },
    };
  } catch (error) {
    return {
      list: { items: [], meta: buildPaginationMeta(query.page, query.pageSize, 0) },
      filterOptions: NO_OPTIONS,
      effectiveQuery: query,
      loadError: apiMessage(error, "The doctor list could not be loaded."),
    };
  }
}

/**
 * Reads the address bar and the API on the server, then hands both to the view.
 * The rows are in the HTML before the browser runs any script, and every filter
 * change re-enters this component with the new query — which is why the view
 * itself never fetches a list.
 */
export default async function DoctorsContent({
  searchParams,
}: DoctorsContentProps) {
  const query = readDoctorQuery(toSearchParams(await searchParams));
  const { list, filterOptions, effectiveQuery, loadError } = await readDoctors(query);

  return (
    <DoctorsView
      query={effectiveQuery}
      list={list}
      filterOptions={filterOptions}
      loadError={loadError}
    />
  );
}
