import type { PaginationMeta, PaginationParams } from "@/types/pagination";

export const DEFAULT_PAGE_SIZE = 10;

/** `Jan 15, 2026` — the shape every table cell and detail header uses. */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | number): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** What a route segment receives for `searchParams` in the App Router. */
export type SearchParamsInput = Promise<
  Record<string, string | string[] | undefined>
>;

/**
 * Next hands route segments their query as a promise of a flat record, where a
 * repeated key may arrive as an array. `URLSearchParams` is the one shape both
 * the server render and the client view can feed the same codec, so every list
 * page converts once, at the edge of the route.
 */
export function toSearchParams(
  source: Awaited<SearchParamsInput>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    params.set(key, Array.isArray(value) ? (value[0] ?? "") : value);
  }

  return params;
}

/** Reads `page`/`pageSize` out of a URLSearchParams, clamped to sane values. */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultPageSize: number = DEFAULT_PAGE_SIZE,
): PaginationParams {
  const rawPage = Number(searchParams.get("page"));
  const rawPageSize = Number(searchParams.get("pageSize"));

  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(100, Math.floor(rawPageSize))
      : defaultPageSize;

  return { page, pageSize };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/** Turns a flat value into the lowercase term the API mirrors for searching. */
export function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}
