import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  /** An explicit hex colour, used when the value carries its own palette. */
  color?: string;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
} as const;

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  neutral: "bg-gray-100 text-gray-700 border border-gray-200",
} as const;

const Badge: React.FC<BadgeProps> = ({
  children,
  color,
  variant = "neutral",
  className = "",
  size = "md",
}) => {
  if (color) {
    return (
      <span
        className={`inline-flex items-center rounded-full capitalize font-medium ${sizeStyles[size]} ${className}`}
        style={{ backgroundColor: `${color}18`, color }}
      >
        <span
          className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full capitalize font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
