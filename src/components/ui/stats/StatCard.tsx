import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  meta?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
  iconBgColor?: string;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  meta,
  icon,
  trend,
  className = "",
  iconBgColor = "bg-indigo-50",
  iconColor = "text-indigo-600",
  bgColor = "bg-white",
  borderColor = "border-gray-200",
}) => {
  return (
    <div
      className={`rounded-xl border ${borderColor} ${bgColor} p-5 shadow-xs transition-shadow hover:shadow-md max-sm:p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-500 max-sm:whitespace-normal max-sm:break-words max-sm:text-xs">
            {title}
          </p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900 max-sm:text-xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 truncate text-xs text-gray-500 max-sm:break-words max-sm:whitespace-normal max-sm:text-[11px]">
              {subtitle}
            </p>
          )}
          {meta && (
            <p className="mt-0.5 truncate text-xs text-gray-500 max-sm:break-words max-sm:whitespace-normal max-sm:text-[11px]">
              {meta}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`inline-flex items-center text-xs font-semibold ${
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`shrink-0 rounded-lg p-3 ${iconBgColor} ${iconColor} max-sm:p-1.5`}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
