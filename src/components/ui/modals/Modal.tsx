"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isHiddenCloseButton?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  isHiddenCloseButton = false,
}) => {
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ${className}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900 max-sm:text-sm">
            {title}
          </h2>
          {!isHiddenCloseButton && onClose && (
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <IoClose className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="sidebar-scrollbar flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalContent;

  return createPortal(modalContent, document.body);
};

export default Modal;
