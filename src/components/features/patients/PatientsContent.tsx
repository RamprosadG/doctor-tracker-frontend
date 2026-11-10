import PatientsView from "./PatientsView";
import { apiPrimaryError } from "@/lib/api-client";
import { readPatientQuery } from "@/lib/patient-query";
import { fetchPatientFilterOptions, fetchPatientList } from "@/lib/patients-server";
import { buildPaginationMeta, toSearchParams, type SearchParamsInput } from "@/lib/utils";
import type { PaginatedPayload } from "@/types/api";
import type {
  Patient,
  PatientFilterOptions,
  PatientListQuery,
} from "@/types/patient";

interface PatientsContentProps {
  searchParams: SearchParamsInput;
}

interface PatientsRead {
  list: PaginatedPayload<Patient>;
  filterOptions: PatientFilterOptions;
  /** The query the view should treat as current, with the page the API actually served. */
  effectiveQuery: PatientListQuery;
  loadError?: string;
}

const NO_OPTIONS: PatientFilterOptions = { conditions: [], doctors: [] };

/**
 * Both reads belong to the render, so a failure is answered here rather than
 * thrown at the viewer: the filters, the empty table and the reason the rows
 * did not arrive still make a usable page.
 *
 * They are settled apart on purpose. A query string the API refuses — a visit
 * window that ends before it starts — is a reason the rows are missing, not a
 * reason to blank the dropdowns as well; and the two lists behind those
 * dropdowns come from their own endpoint, so one failing read leaves the other
 * still filling its fields.
 */
async function readPatients(query: PatientListQuery): Promise<PatientsRead> {
  const [listResult, optionsResult] = await Promise.allSettled([
    fetchPatientList(query),
    fetchPatientFilterOptions(query.doctorId),
  ]);

  const filterOptions =
    optionsResult.status === "fulfilled" ? optionsResult.value : NO_OPTIONS;

  if (listResult.status === "fulfilled") {
    const list = listResult.value;

    // The API clamps a page beyond the last one, and the view has to push the
    // page it actually showed — otherwise a delete that shrinks the result set
    // would leave the address bar asking for a page that no longer exists.
    return {
      list,
      filterOptions,
      effectiveQuery: { ...query, page: list.meta.page, pageSize: list.meta.pageSize },
    };
  }

  return {
    list: { items: [], meta: buildPaginationMeta(query.page, query.pageSize, 0) },
    filterOptions,
    effectiveQuery: query,
    loadError: apiPrimaryError(listResult.reason, "The patient list could not be loaded."),
  };
}

/**
 * Reads the address bar and the API on the server, then hands both to the view.
 * The rows are in the HTML before the browser runs any script, and every filter
 * change re-enters this component with the new query — which is why the view
 * itself never fetches a list.
 */
export default async function PatientsContent({
  searchParams,
}: PatientsContentProps) {
  const query = readPatientQuery(toSearchParams(await searchParams));
  const { list, filterOptions, effectiveQuery, loadError } = await readPatients(query);

  return (
    <PatientsView
      query={effectiveQuery}
      list={list}
      filterOptions={filterOptions}
      loadError={loadError}
    />
  );
}
