"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoIosArrowDown, IoIosStar } from "react-icons/io";

export interface DropdownOption {
  value: string;
  label: string;
}

export type DropdownOptionsLoader = (
  query: { search: string; page: number },
  signal: AbortSignal,
) => Promise<{ options: DropdownOption[]; hasNextPage: boolean }>;

interface RemoteRequest {
  search: string;
  page: number;
  delay: number;
}

interface RemoteResult {
  request: RemoteRequest;
  options: DropdownOption[];
  hasNextPage: boolean;
  error?: string;
}

interface DropdownProps {
  label?: string;
  ariaLabel?: string;
  /** Initial labels; an empty-value choice also remains available when remote. */
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
  searchLabel?: string;
  /** Fetches only the requested page. Remote results are never filtered locally. */
  loadOptions?: DropdownOptionsLoader;
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
  ariaLabel,
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
  searchLabel,
  loadOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [request, setRequest] = useState<RemoteRequest | null>(null);
  const [remoteResult, setRemoteResult] = useState<RemoteResult | null>(null);
  const [lastSelection, setLastSelection] = useState<DropdownOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generatedId = useId();
  const triggerId = id ?? name ?? generatedId;
  const listboxId = `${generatedId}-options`;

  const selectedOption = options.find((option) => option.value === value) ??
    (loadOptions && lastSelection?.value === value ? lastSelection : undefined) ??
    (loadOptions ? remoteResult?.options.find((option) => option.value === value) : undefined);
  const isLoading = Boolean(loadOptions && request && remoteResult?.request !== request);
  const loadError = !isLoading ? remoteResult?.error : undefined;
  // Hide the previous search immediately, including during the debounce interval.
  const remoteOptions = remoteResult && remoteResult.request.search === request?.search &&
    !(isLoading && request.page === 1) ? remoteResult.options : [];
  const clearOption = loadOptions ? options.find((option) => option.value === "") : undefined;

  /** Closing and reopening starts at page one with no search term. */
  const visibleOptions = loadOptions
    ? [...(clearOption ? [clearOption] : []), ...remoteOptions.filter((option) => option.value !== clearOption?.value)]
    : searchable && term.trim()
      ? options.filter((option) =>
          option.label.toLowerCase().includes(term.trim().toLowerCase()),
        )
      : options;

  const cancelRequest = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const closeMenu = useCallback(() => {
    cancelRequest();
    setIsOpen(false);
  }, [cancelRequest]);

  const selectOption = (option: DropdownOption) => {
    if (loadOptions && isLoading && request?.page === 1 && option.value !== "") return;
    if (loadOptions) setLastSelection(option);
    closeMenu();
    buttonRef.current?.focus();
    onChange(option.value);
  };

  useEffect(() => {
    if (!isOpen || disabled || !loadOptions || !request) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    const load = async () => {
      if (controller.signal.aborted) return;
      try {
        const result = await loadOptions(
          { search: request.search, page: request.page }, controller.signal,
        );
        // Some loaders cannot cancel their transport. Never publish their stale result.
        if (controller.signal.aborted) return;
        setRemoteResult((previous) => ({
          request,
          options: [...new Map([
            ...(request.page > 1 ? previous?.options ?? [] : []),
            ...result.options,
          ].map((option) => [option.value, option])).values()],
          hasNextPage: result.hasNextPage,
        }));
      } catch {
        if (controller.signal.aborted) return;
        setRemoteResult((previous) => ({
          request,
          options: request.page > 1 ? previous?.options ?? [] : [],
          hasNextPage: request.page > 1 && Boolean(previous?.hasNextPage),
          error: "Options could not be loaded.",
        }));
      }
    };

    const timer = request.delay ? setTimeout(load, request.delay) : undefined;
    if (!request.delay) void load();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, disabled, loadOptions, request]);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedHeight = loadOptions
      ? MENU_MAX_HEIGHT
      : Math.min(options.length * 38 + 8, MENU_MAX_HEIGHT);
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
  }, [options.length, loadOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu]);

  useEffect(() => {
    if (!isOpen || disabled) return;

    const handleReflow = () => updateMenuPosition();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Consume Escape before the enclosing modal's document listener.
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("resize", handleReflow);
    window.addEventListener("scroll", handleReflow, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("resize", handleReflow);
      window.removeEventListener("scroll", handleReflow, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, disabled, updateMenuPosition, closeMenu]);

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
              aria-label={searchLabel ?? searchPlaceholder}
              aria-controls={listboxId}
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              onChange={(event) => {
                const search = event.target.value;
                setTerm(search);
                if (loadOptions) {
                  cancelRequest();
                  setRequest({ search: search.trim(), page: 1, delay: 350 });
                }
              }}
              // Enter takes the first current match, never the previous search.
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (event.nativeEvent.isComposing || (loadOptions && isLoading)) return;
                const first = loadOptions && term.trim()
                  ? remoteOptions[0] : visibleOptions[0];
                if (first) selectOption(first);
              }}
            />
          </div>
        )}

        {visibleOptions.length === 0 && !loadOptions ? (
          <p className="px-3.5 py-3 text-sm text-gray-500">Nothing matches that.</p>
        ) : (
          <ul id={listboxId} role="listbox" aria-label={ariaLabel ?? label ?? placeholder} aria-busy={isLoading} className="py-1">
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
                onClick={() => selectOption(option)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  selectOption(option);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
        {loadOptions && (
          <>
            {isLoading && (
              <p role="status" className="px-3.5 py-3 text-sm text-gray-500">Loading options...</p>
            )}
            {loadError && (
              <div className="px-3.5 py-3 text-sm text-gray-500">
                <p role="alert">{loadError}</p>
                <button
                  type="button"
                  className="mt-2 cursor-pointer text-indigo-700 underline focus:outline-indigo-500"
                  onClick={() => request && setRequest({ ...request, delay: 0 })}
                >
                  Retry
                </button>
              </div>
            )}
            {!isLoading && !loadError && remoteOptions.length === 0 && (
              <p role="status" className="px-3.5 py-3 text-sm text-gray-500">Nothing matches that.</p>
            )}
            {remoteResult?.hasNextPage && !loadError && (
              <button
                type="button"
                disabled={isLoading}
                className="w-full cursor-pointer px-3.5 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50 focus:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  if (!request || isLoading) return;
                  setRequest({ search: request.search, page: request.page + 1, delay: 0 });
                }}
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    ) : null;

  return (
    <div className="flex w-full flex-col gap-1" ref={containerRef}>
      {label && (
        <div className="flex items-center gap-1">
          <label
            htmlFor={triggerId}
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
          id={triggerId}
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
            if (isOpen) {
              closeMenu();
              return;
            }
            updateMenuPosition();
            setTerm("");
            // Keep the portal inside aria-modal, without the form's scroll clipping.
            setPortalTarget(buttonRef.current?.closest<HTMLElement>('[role="dialog"]') ?? document.body);
            if (loadOptions) setRequest({ search: "", page: 1, delay: 0 });
            setIsOpen(true);
          }}
          aria-label={ariaLabel}
          aria-expanded={isOpen && !disabled}
          aria-controls={isOpen && !disabled ? listboxId : undefined}
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

      {menu && portalTarget && createPortal(menu, portalTarget)}

      {error && (
        <span className="mt-0.5 text-xs font-medium text-red-600">{error}</span>
      )}
    </div>
  );
};

export default Dropdown;
