"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const COLOR_STYLES = {
  default:
    "text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800",
  blue: "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700",
  indigo:
    "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700",
  emerald:
    "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700",
  amber: "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700",
  rose: "text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700",
} as const;

export type TableActionColor = keyof typeof COLOR_STYLES;

interface TableActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  children: ReactNode;
  isLoading?: boolean;
  color?: TableActionColor;
}

export function TableActionButton({
  tooltip,
  children,
  isLoading = false,
  color = "default",
  className = "",
  disabled,
  ...props
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${COLOR_STYLES[color]} ${className}`}
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

interface TableActionLinkProps {
  href: string;
  tooltip: string;
  children: ReactNode;
  color?: TableActionColor;
  className?: string;
}

export function TableActionLink({
  href,
  tooltip,
  children,
  color = "default",
  className = "",
}: TableActionLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${COLOR_STYLES[color]} ${className}`}
      aria-label={tooltip}
      title={tooltip}
    >
      {children}
    </Link>
  );
}
