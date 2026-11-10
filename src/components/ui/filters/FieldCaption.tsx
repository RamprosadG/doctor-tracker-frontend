import type { ReactNode } from "react";

/**
 * The quiet label above a filter control, and the same quiet label beside a
 * value in a phone-width card. One component because both are the same thing —
 * a caption that must never compete with the value it names.
 */
export default function FieldCaption({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </span>
  );
}
