"use client";

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { FaRegTrashAlt } from "react-icons/fa";
import Button from "@/components/ui/buttons/Button";

interface ConfirmModalProps {
  title: string;
  text: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * The delete gate is a decision rather than a form, so it centres its content
 * and leads with the icon tile instead of a title bar. `z-[60]` is deliberate: a
 * `Modal` opened on top of a table keeps its own `z-50`, and this has to paint
 * over it.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  text,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl outline-none"
      >
        <div className="p-6 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-100 text-3xl text-red-600"
          >
            <FaRegTrashAlt />
          </span>

          <h2 className="break-words text-base font-semibold text-slate-900 max-sm:text-sm">
            {title}
          </h2>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600">
            {text}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="w-full max-sm:gap-1.5 max-sm:px-2 max-sm:text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              className="w-full max-sm:gap-1.5 max-sm:px-2 max-sm:text-xs"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Resolves instead of rendering, so a caller keeps
 * `const isConfirmed = await confirmDelete({ … })` and never holds dialog state
 * of its own.
 */
export const confirmDelete = ({
  title,
  text,
  confirmLabel,
}: {
  title: string;
  text: string;
  confirmLabel?: string;
}): Promise<boolean> =>
  new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    const close = (confirmed: boolean) => {
      root.unmount();
      host.remove();
      resolve(confirmed);
    };

    root.render(
      <ConfirmModal
        title={title}
        text={text}
        confirmLabel={confirmLabel}
        onCancel={() => close(false)}
        onConfirm={() => close(true)}
      />,
    );
  });

export default ConfirmModal;
