/**
 * The pagination contract shared by every list endpoint of the API and every
 * table on the page, so a response can be handed to <Pagination /> unchanged.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
