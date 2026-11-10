import React from "react";
import { IoIosStar } from "react-icons/io";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  className?: string;
  error?: string;
  required?: boolean;
  hideOptionalText?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  className = "",
  error,
  required = false,
  hideOptionalText = false,
  rows = 4,
  value,
  onChange,
  ...props
}) => {
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
      <textarea
        rows={rows}
        className={`
          w-full resize-y rounded-lg border px-3.5 py-2 text-sm outline-none
          bg-white text-slate-900 placeholder:text-gray-400 shadow-xs
          transition-all duration-200
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          hover:border-indigo-400
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }
          ${className}
        `}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && (
        <span className="mt-0.5 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
};

export default Textarea;
