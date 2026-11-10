import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { IoIosStar } from "react-icons/io";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  hideOptionalText?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  className = "",
  error,
  icon,
  type = "text",
  required = false,
  value,
  onChange,
  hideOptionalText = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <div className="flex items-center gap-1">
          <label
            htmlFor={props.id || props.name}
            className="text-sm font-medium text-slate-800 max-sm:text-xs"
          >
            {label}
          </label>
          {required ? (
            <IoIosStar className="h-2 w-2 mb-1.5 text-red-500" />
          ) : (
            !hideOptionalText && (
              <span className="text-xs font-normal text-gray-400">
                (Optional)
              </span>
            )
          )}
        </div>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={isPasswordField && showPassword ? "text" : type}
          className={`
            w-full rounded-lg border px-3.5 py-2 text-sm outline-none
            bg-white text-slate-900 placeholder:text-gray-400 shadow-xs
            transition-all duration-200
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            hover:border-indigo-400
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }
            ${icon ? "pl-9" : ""}
            ${isPasswordField ? "pr-10" : ""}
            ${className}
          `}
          value={value}
          onChange={onChange}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded text-gray-500 transition-colors hover:text-gray-800 focus:outline-none"
            aria-label={showPassword ? "Hide Password" : "Show Password"}
          >
            {showPassword ? (
              <FaRegEyeSlash className="h-4 w-4" />
            ) : (
              <FaRegEye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <span className="mt-0.5 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
};

export default Input;
