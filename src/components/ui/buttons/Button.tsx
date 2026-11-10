import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?:
    | "primary"
    | "secondary"
    | "primary-outline"
    | "secondary-outline"
    | "white"
    | "ghost"
    | "danger";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
} as const;

const variantStyles = {
  primary: `
    bg-indigo-600 text-white
    hover:bg-indigo-700
    active:bg-indigo-800
    focus-visible:ring-indigo-500
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-slate-700 text-white
    hover:bg-slate-800
    active:bg-slate-900
    focus-visible:ring-slate-500
    shadow-sm hover:shadow-md
  `,
  white: `
    bg-white text-slate-800
    border border-slate-200
    hover:bg-slate-50
    active:bg-slate-100
    focus-visible:ring-slate-400
    shadow-sm hover:shadow-md
  `,
  "primary-outline": `
    bg-transparent text-indigo-600
    border border-indigo-600
    hover:bg-indigo-700
    active:bg-indigo-800
    hover:text-white
    active:text-white
    focus-visible:ring-indigo-500
  `,
  "secondary-outline": `
    bg-transparent text-slate-600
    border border-slate-300
    hover:bg-slate-800
    active:bg-slate-900
    hover:text-white
    active:text-white
    focus-visible:ring-slate-400
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    active:bg-red-800
    focus-visible:ring-red-500
    shadow-sm hover:shadow-md
  `,
  ghost: `
    bg-transparent text-slate-600
    hover:bg-slate-100
    active:bg-slate-200
    focus-visible:ring-slate-400
  `,
} as const;

const Button: React.FC<ButtonProps> = ({
  isLoading,
  children,
  className = "",
  variant = "primary",
  icon,
  iconPosition = "left",
  size = "md",
  type = "button",
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    rounded-lg font-medium
    focus-visible:outline-none focus-visible:ring-2
    transition-all duration-200
    disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed
    ${className}
  `;

  const renderIcon = () => {
    if (!icon && !isLoading) return null;

    if (isLoading) {
      return (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      );
    }

    return <span className="shrink-0">{icon}</span>;
  };

  return (
    <button
      // An omitted type defaults to "submit" in HTML, which would send the enclosing form.
      type={type}
      className={`${variantStyles[variant]} ${sizeStyles[size]} ${baseStyles}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {iconPosition === "left" && renderIcon()}
      <span>{children}</span>
      {iconPosition === "right" && renderIcon()}
    </button>
  );
};

export default Button;
