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
