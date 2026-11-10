import { DEFAULT_PAGE_SIZE, parsePagination } from "@/lib/utils";
import type { QueryParams } from "@/types/api";
import type { PatientListQuery, PatientSort } from "@/types/patient";
import { PATIENT_GENDERS } from "@/types/patient";

export const DEFAULT_PATIENT_SORT: PatientSort = "-visitDate";

/** The labels the sort dropdown offers, in the order its options appear. The
 *  values are exactly the keys the API whitelists — every one of them an order
 *  the patient indexes can already produce — so a hand-typed `?sort=` outside
 *  this list is dropped rather than sent. */
export const PATIENT_SORT_OPTIONS: { value: PatientSort; label: string }[] = [
  { value: "-visitDate", label: "Most recent visit" },
  { value: "visitDate", label: "Earliest visit" },
  { value: "name", label: "Patient name A to Z" },
  { value: "-name", label: "Patient name Z to A" },
];

const SORT_VALUES: string[] = PATIENT_SORT_OPTIONS.map((option) => option.value);

const FILTER_KEYS = [
  "search",
  "doctorId",
  "condition",
  "gender",
  "from",
  "to",
] as const satisfies readonly (keyof PatientListQuery)[];

/** A query string is hand-editable, so a value is read trimmed and empty means
 *  "no filter" rather than "invalid". */
const readFilter = (params: URLSearchParams, key: string): string | undefined =>
  params.get(key)?.trim() || undefined;

/** An enum filter is only kept when it names one of the values the API accepts;
 *  a typo in the address bar filters nothing rather than failing the read. */
const readEnum = <T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined => {
  const value = readFilter(params, key);

  return allowed.includes(value as T) ? (value as T) : undefined;
};

/**
 * Address bar → query object. This is the only place the parameter names of the
 * patients list are spelled out, so the server render and the client view cannot
 * drift apart on what a filter is called.
 */
export function readPatientQuery(params: URLSearchParams): PatientListQuery {
  const { page, pageSize } = parsePagination(params);
  const sort = readFilter(params, "sort");

  return {
    page,
    pageSize,
    search: readFilter(params, "search"),
    doctorId: readFilter(params, "doctorId"),
    condition: readFilter(params, "condition"),
    gender: readEnum(params, "gender", PATIENT_GENDERS),
    from: readFilter(params, "from"),
    to: readFilter(params, "to"),
    sort: SORT_VALUES.includes(sort ?? "") ? (sort as PatientSort) : DEFAULT_PATIENT_SORT,
  };
}

/**
 * Query object → address bar. Defaults are left out, so browsing the first page
 * at the default sort keeps a clean URL and every link copied from the portal
 * carries only what actually narrows the list.
 */
export function patientQueryToSearchParams(query: PatientListQuery): URLSearchParams {
  const params = new URLSearchParams();

  const put = (key: string, value: string | number | undefined): void => {
    const text = value === undefined ? "" : String(value);
    if (text) params.set(key, text);
  };

  for (const key of FILTER_KEYS) put(key, query[key]);
  if (query.sort !== DEFAULT_PATIENT_SORT) put("sort", query.sort);
  if (query.page > 1) put("page", query.page);
  if (query.pageSize !== DEFAULT_PAGE_SIZE) put("pageSize", query.pageSize);

  return params;
}

/** Query object → the API call. Blank filters are dropped by `buildUrl`. */
export const patientQueryToApiParams = (query: PatientListQuery): QueryParams => ({
  ...query,
});

/**
 * A narrower result set can no longer contain the page the user was on, so any
 * filter or sort change starts over at page 1. The API clamps a stale page
 * anyway; this keeps the address bar honest about which page is showing.
 */
export const withFirstPage = (
  query: PatientListQuery,
  patch: Partial<PatientListQuery>,
): PatientListQuery => ({ ...query, ...patch, page: 1 });

/** Reset is offered only while the URL actually carries something to clear. */
export const hasQueryState = (query: PatientListQuery): boolean =>
  patientQueryToSearchParams(query).toString() !== "";
