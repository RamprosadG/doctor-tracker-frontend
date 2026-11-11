import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  expandedRowId?: string | null;
  renderExpandedRow?: (item: T, index: number) => React.ReactNode;
  renderCard?: (item: T, index: number) => React.ReactNode;
}

function DataTable<T extends { id?: string }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No records found.",
  onRowClick,
  className = "",
  rowClassName = "",
  expandedRowId = null,
  renderExpandedRow,
  renderCard,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      >
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading Records...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      >
        <div className="p-12 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {renderCard && (
        <ul className="divide-y divide-slate-200 lg:hidden">
          {data.map((item, index) => (
            <li key={item.id ?? index} className="px-4 py-4">
              {renderCard(item, index)}
            </li>
          ))}
        </ul>
      )}
      {/* A card list owns mobile and tablet screens, so the table starts at the lg (laptop/desktop) edge. */}
      <div
        className={
          renderCard
            ? "hidden w-full overflow-x-auto lg:block"
            : "w-full overflow-x-auto"
        }
      >
        <table className="w-full min-w-full divide-y divide-slate-200 text-left">
          <thead>
            <tr className="bg-slate-100">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 ${column.headerClassName || ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {data.map((item, index) => {
              const computedRowClassName =
                typeof rowClassName === "function"
                  ? rowClassName(item, index)
                  : rowClassName;
              const isExpanded =
                Boolean(renderExpandedRow) &&
                expandedRowId !== null &&
                item.id === expandedRowId;

              return (
                <React.Fragment key={item.id ?? index}>
                  <tr
                    className={`
                      transition-colors duration-150
                      ${index % 2 === 0 ? "bg-white" : "bg-slate-100"}
                      hover:bg-blue-50
                      ${onRowClick ? "cursor-pointer" : ""}
                      ${computedRowClassName}
                    `}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`whitespace-nowrap px-5 py-3.5 text-sm text-slate-700 ${column.className || ""}`}
                      >
                        {column.render
                          ? column.render(item, index)
                          : ((item as Record<string, unknown>)[
                              column.key
                            ] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow && (
                    <tr className="bg-slate-50">
                      <td colSpan={columns.length} className="p-0">
                        {renderExpandedRow(item, index)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
