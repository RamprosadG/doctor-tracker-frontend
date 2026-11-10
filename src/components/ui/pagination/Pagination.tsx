import React from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageInfo?: boolean;
  total?: number;
  limit?: number;
}

const MAX_VISIBLE = 5;

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];

  if (totalPages <= MAX_VISIBLE) {
    for (let page = 1; page <= totalPages; page += 1) pages.push(page);
    return pages;
  }

  if (currentPage <= 3) {
    for (let page = 1; page <= 4; page += 1) pages.push(page);
    pages.push("...", totalPages);
    return pages;
  }

  if (currentPage >= totalPages - 2) {
    pages.push(1, "...");
    for (let page = totalPages - 3; page <= totalPages; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  pages.push(1, "...");
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    pages.push(page);
  }
  pages.push("...", totalPages);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  showPageInfo = true,
  total,
  limit,
}) => {
  if (totalPages <= 1 && !showPageInfo) return null;

  const startItem = total && limit ? (currentPage - 1) * limit + 1 : 0;
  const endItem = total && limit ? Math.min(currentPage * limit, total) : 0;

  return (
    <div
      className={`flex flex-col items-center justify-between gap-4 sm:flex-row ${className}`}
    >
      {showPageInfo && total !== undefined && limit !== undefined && (
        <p className="text-sm text-gray-600">
          Showing {startItem} to {endItem} of {total} entries
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 max-sm:h-8 max-sm:px-1.5"
          aria-label="Previous Page"
        >
          <IoChevronBack className="h-4 w-4 max-sm:h-3.5 max-sm:w-3.5" />
        </button>

        {getVisiblePages(currentPage, totalPages).map((page, index) => {
          if (typeof page !== "number") {
            return (
              <span
                key={`gap-${index}`}
                className="px-3 py-2 text-gray-500 max-sm:px-1.5"
              >
                ...
              </span>
            );
          }

          const pageNumber: number = page;

          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              aria-current={currentPage === pageNumber ? "page" : undefined}
              className={`inline-flex h-9 min-w-10 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors max-sm:h-8 max-sm:min-w-8 max-sm:px-2 max-sm:text-xs ${
                currentPage === pageNumber
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 max-sm:h-8 max-sm:px-1.5"
          aria-label="Next Page"
        >
          <IoChevronForward className="h-4 w-4 max-sm:h-3.5 max-sm:w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
