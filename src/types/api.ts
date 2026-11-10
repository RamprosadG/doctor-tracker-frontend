import type { PaginationMeta } from "@/types/pagination";

/**
 * Every API response arrives in this envelope, so unwrapping happens in one
 * place (`lib/api-client.ts`) instead of at each call site.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: FieldErrors;
}

/** The `data` shape of every paginated list endpoint. */
export interface PaginatedPayload<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Field-level validation errors, keyed by the form field name. */
export type FieldErrors = Record<string, string>;

/** Flat record accepted for query strings; empties are dropped before sending. */
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;
