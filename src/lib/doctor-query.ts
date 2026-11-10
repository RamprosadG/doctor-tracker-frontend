import { DEFAULT_PAGE_SIZE, parsePagination } from "@/lib/utils";
import type { QueryParams } from "@/types/api";
import type { DoctorListQuery, DoctorSort } from "@/types/doctor";

export const DEFAULT_DOCTOR_SORT: DoctorSort = "-createdAt";

/** The labels the sort dropdown offers, in the order its options appear. The
 *  values are exactly the keys the API whitelists, so a hand-typed `?sort=`
 *  outside this list is dropped rather than sent. */
export const DOCTOR_SORT_OPTIONS: { value: DoctorSort; label: string }[] = [
  { value: "-createdAt", label: "Recently added" },
  { value: "createdAt", label: "Longest in the practice" },
  { value: "name", label: "Doctor name A to Z" },
  { value: "-name", label: "Doctor name Z to A" },
  { value: "-updatedAt", label: "Recently updated" },
  { value: "updatedAt", label: "Least recently updated" },
];

const SORT_VALUES: string[] = DOCTOR_SORT_OPTIONS.map((option) => option.value);

const FILTER_KEYS = [
  "search",
  "specialization",
  "hospital",
  "from",
  "to",
] as const satisfies readonly (keyof DoctorListQuery)[];

/** A query string is hand-editable, so a value is read trimmed and empty means
 *  "no filter" rather than "invalid". */
const readFilter = (params: URLSearchParams, key: string): string | undefined =>
  params.get(key)?.trim() || undefined;

/**
 * Address bar → query object. This is the only place the parameter names of the
 * doctors list are spelled out, so the server render and the client view cannot
 * drift apart on what a filter is called.
 */
export function readDoctorQuery(params: URLSearchParams): DoctorListQuery {
  const { page, pageSize } = parsePagination(params);
  const sort = readFilter(params, "sort");

  return {
    page,
    pageSize,
    search: readFilter(params, "search"),
    specialization: readFilter(params, "specialization"),
    hospital: readFilter(params, "hospital"),
    from: readFilter(params, "from"),
    to: readFilter(params, "to"),
    sort: SORT_VALUES.includes(sort ?? "") ? (sort as DoctorSort) : DEFAULT_DOCTOR_SORT,
  };
}

/**
 * Query object → address bar. Defaults are left out, so browsing the first page
 * at the default sort keeps a clean URL and every link copied from the portal
 * carries only what actually narrows the list.
 */
export function doctorQueryToSearchParams(query: DoctorListQuery): URLSearchParams {
  const params = new URLSearchParams();

  const put = (key: string, value: string | number | undefined): void => {
    const text = value === undefined ? "" : String(value);
    if (text) params.set(key, text);
  };

  for (const key of FILTER_KEYS) put(key, query[key]);
  if (query.sort !== DEFAULT_DOCTOR_SORT) put("sort", query.sort);
  if (query.page > 1) put("page", query.page);
  if (query.pageSize !== DEFAULT_PAGE_SIZE) put("pageSize", query.pageSize);

  return params;
}

/** Query object → the API call. Blank filters are dropped by `buildUrl`. */
export const doctorQueryToApiParams = (query: DoctorListQuery): QueryParams => ({
  ...query,
});

/**
 * A narrower result set can no longer contain the page the user was on, so any
 * filter or sort change starts over at page 1. The API clamps a stale page
 * anyway; this keeps the address bar honest about which page is showing.
 */
export const withFirstPage = (
  query: DoctorListQuery,
  patch: Partial<DoctorListQuery>,
): DoctorListQuery => ({ ...query, ...patch, page: 1 });

/** Reset is offered only while the URL actually carries something to clear. */
export const hasQueryState = (query: DoctorListQuery): boolean =>
  doctorQueryToSearchParams(query).toString() !== "";
