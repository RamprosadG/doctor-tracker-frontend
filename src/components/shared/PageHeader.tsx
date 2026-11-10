import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

/**
 * The one header every page opens with, so the title, the sentence that explains
 * the page and the action buttons keep the same rhythm across the portal.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 max-sm:text-lg">
          {title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-3 max-sm:w-full">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
