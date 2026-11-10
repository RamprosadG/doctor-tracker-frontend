import Link from "next/link";
import { TbStethoscope } from "react-icons/tb";

/** Brand strip above the sign-in card — the rail and navbar stay out of an
 *  unauthenticated page so there is nothing to click through to. */
export function LoginHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
        <Link href="/login" className="flex items-center">
          <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <TbStethoscope className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Doctor Tracker
          </span>
        </Link>
      </div>
    </header>
  );
}
