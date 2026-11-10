"use client";

import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { TbStethoscope } from "react-icons/tb";

interface NavbarProps {
  onOpenSidebar: () => void;
}

export function Navbar({ onOpenSidebar }: NavbarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 bg-white shadow-md transition-all duration-300 hover:shadow-lg lg:pl-72">
      <div className="flex h-[var(--app-nav-height)] items-center">
        <div className="flex w-full items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSidebar}
              className="cursor-pointer rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="Open Menu"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center lg:hidden">
              <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <TbStethoscope className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-slate-900">
                Doctor Tracker
              </span>
            </Link>
          </div>

          {/* The session controls mount here once authentication lands. */}
          <div className="flex items-center gap-2" />
        </div>
      </div>
    </header>
  );
}
