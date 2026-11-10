"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { FiX } from "react-icons/fi";
import { TbStethoscope } from "react-icons/tb";
import { HiOutlineClipboardList, HiOutlineHome, HiOutlineUserGroup } from "react-icons/hi";

interface NavItem {
  name: string;
  href: string;
  icon: IconType;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: HiOutlineHome },
  { name: "Doctors", href: "/doctors", icon: HiOutlineUserGroup },
  { name: "Patients", href: "/patients", icon: HiOutlineClipboardList },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * A section stays active on the routes nested under it, so `/doctors/<id>`
 * still marks Doctors. Home is the exception: every path starts with `/`.
 */
function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center hover:opacity-80 transition-opacity"
    >
      <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
        <TbStethoscope className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900 text-nowrap">
        Doctor Tracker
      </span>
    </Link>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navList = (onNavigate?: () => void) => (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center rounded-lg px-4 h-12 transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-indigo-600" : "text-gray-600"
                }`}
              />
              <span className="ml-3 text-sm font-medium text-nowrap">
                {item.name}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-72 flex-col border-r border-gray-200 bg-white pl-6 pr-4 drop-shadow-xl hover:drop-shadow-2xl">
        <div className="flex h-16 shrink-0 items-center border-b border-gray-100">
          <Brand />
        </div>
        <nav className="sidebar-scrollbar flex-1 overflow-y-auto py-3">
          {navList()}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-35 bg-black/50 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-gray-200 bg-white px-4 drop-shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100">
          <Brand onNavigate={onClose} />
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Close Sidebar"
          >
            <FiX className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="sidebar-scrollbar flex-1 overflow-y-auto py-3">
          {navList(onClose)}
        </nav>
      </aside>
    </>
  );
}
