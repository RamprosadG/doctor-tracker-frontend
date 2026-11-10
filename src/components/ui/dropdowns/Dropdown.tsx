"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoIosArrowDown, IoIosStar } from "react-icons/io";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  hideOptionalText?: boolean;
  disabled?: boolean;
  /** Type-to-filter box above the option list, for a choice with more entries
   *  than anybody can scan at a glance. Off by default, so every existing
   *  caller keeps the plain listbox. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

const MENU_MAX_HEIGHT = 240;
const MENU_OFFSET = 4;

/**
 * A listbox button rather than a native `<select>`, because the filter rows need
 * the same truncated-label, hover and ring treatment as every other field here,
 * and the option list is measured against the viewport so it never opens off
 * screen at the bottom of a long table.
 */
const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  className = "",
  error,
  required = false,
  placeholder = "Select An Option",
  name,
  id,
  hideOptionalText = false,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  /** The filter is local to one opening: closing and reopening shows the full
   *  list again rather than whatever was typed last time. */
  const visibleOptions =
    searchable && term.trim()
      ? options.filter((option) =>
          option.label.toLowerCase().includes(term.trim().toLowerCase()),
        )
      : options;

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedHeight = Math.min(options.length * 38 + 8, MENU_MAX_HEIGHT);
    const openAbove =
      rect.bottom + estimatedHeight + MENU_OFFSET > viewportHeight &&
      rect.top > estimatedHeight + MENU_OFFSET;

    setMenuPosition({
      ...(openAbove
        ? { bottom: viewportHeight - rect.top + MENU_OFFSET }
        : { top: rect.bottom + MENU_OFFSET }),
      left: Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8)),
      width: rect.width,
    });
  }, [options.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleReflow = () => updateMenuPosition();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("resize", handleReflow);
    window.addEventListener("scroll", handleReflow, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleReflow);
      window.removeEventListener("scroll", handleReflow, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updateMenuPosition]);

  // Typing is the point of a searchable list, so the caret starts in the box.
  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  // A disabled control must not leave a floating list behind.
  const menu =
    isOpen && !disabled && menuPosition ? (
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: menuPosition.top,
          bottom: menuPosition.bottom,
          left: menuPosition.left,
          width: menuPosition.width,
          maxHeight: MENU_MAX_HEIGHT,
        }}
        className="sidebar-scrollbar z-[70] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
      >
        {searchable && (
          <div className="sticky top-0 border-b border-gray-100 bg-white p-2">
            <input
              ref={searchRef}
              type="text"
              value={term}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              onChange={(event) => setTerm(event.target.value)}
              // Enter takes the first match, so the box alone is enough to pick.
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const [first] = visibleOptions;
                if (!first) return;
                onChange(first.value);
                setIsOpen(false);
              }}
            />
          </div>
        )}

        {visibleOptions.length === 0 ? (
          <p className="px-3.5 py-3 text-sm text-gray-500">Nothing matches that.</p>
        ) : (
          <ul role="listbox" className="py-1">
            {visibleOptions.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                tabIndex={0}
                className={`cursor-pointer px-3.5 py-2 text-sm transition-colors duration-150 hover:bg-indigo-50 ${
                  value === option.value
                    ? "bg-indigo-100 font-medium text-indigo-700"
                    : "text-gray-700"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null;

  return (
    <div className="flex w-full flex-col gap-1" ref={containerRef}>
      {label && (
        <div className="flex items-center gap-1">
          <label
            htmlFor={id ?? name}
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

      <div className="relative w-full min-w-0">
        <button
          ref={buttonRef}
          id={id}
          name={name}
          type="button"
          disabled={disabled}
          className={`
            w-full min-w-0 border rounded-lg px-3.5 py-2 text-sm outline-none font-normal bg-white text-slate-900 shadow-xs
            focus:ring-2 flex items-center justify-between gap-2 cursor-pointer transition-all duration-200
            hover:border-indigo-400
            disabled:cursor-not-allowed disabled:opacity-60
            ${error ? "border-red-500" : "border-gray-300"}
            ${isOpen ? "ring-2 ring-indigo-500 border-indigo-500" : "focus:ring-indigo-500"}
            ${className}
          `}
          onClick={() => {
            if (!isOpen) {
              updateMenuPosition();
              setTerm("");
            }
            setIsOpen((current) => !current);
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span
            className={`block min-w-0 flex-1 truncate whitespace-nowrap text-left ${
              selectedOption ? "font-medium text-slate-900" : "text-gray-400"
            }`}
            title={selectedOption?.label ?? placeholder}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <IoIosArrowDown
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {menu && createPortal(menu, document.body)}

      {error && (
        <span className="mt-0.5 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
};

export default Dropdown;
