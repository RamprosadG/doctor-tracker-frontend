"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiMail } from "react-icons/fi";
import Input from "@/components/ui/inputs/Input";
import Button from "@/components/ui/buttons/Button";
import { showSuccessAlert } from "@/components/ui/alerts/Alerts";
import { useAuth } from "./useAuth";
import { ApiError } from "@/lib/api-client";
import { safeRedirectTarget } from "@/lib/safe-redirect";
import type { FieldErrors } from "@/types/api";

export function LoginForm() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const next = safeRedirectTarget(useSearchParams().get("next"));

  // Two ways to arrive here already signed in: the visitor typed the URL, or a
  // server render bounced them off an expired access token and the bootstrap
  // call has since rotated the session. Either way the form is not for them.
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const localErrors: FieldErrors = {};
    if (!email.trim()) localErrors.email = "Email is required.";
    if (!password) localErrors.password = "Password is required.";
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      showSuccessAlert(`Signed in as ${user.name}.`);
      router.replace(next);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.errors ?? {});
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="admin@doctortracker.local"
        autoComplete="email"
        icon={<FiMail className="h-4 w-4" />}
        value={email}
        error={fieldErrors.email}
        onChange={(event) => setEmail(event.target.value)}
        hideOptionalText
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Your password"
        autoComplete="current-password"
        icon={<FiLock className="h-4 w-4" />}
        value={password}
        error={fieldErrors.password}
        onChange={(event) => setPassword(event.target.value)}
        hideOptionalText
      />

      <Button type="submit" size="lg" disabled={isLoading || isSubmitting} isLoading={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Accounts are created by the API administrator. There is no sign-up.
      </p>
    </form>
  );
}
