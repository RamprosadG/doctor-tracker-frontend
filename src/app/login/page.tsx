import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginHeader } from "@/components/features/auth/LoginHeader";
import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Administrator sign-in for the Doctor Tracker portal.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <LoginHeader />

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sign in to the portal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage doctors, their patients and the practice numbers.
          </p>

          <div className="mt-6">
            <Suspense
              fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-50" />}
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
