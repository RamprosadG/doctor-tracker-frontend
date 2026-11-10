import { AppLayoutShell } from "@/components/shared/AppLayoutShell";
import { requireUser } from "@/lib/session";

/**
 * One guard for the whole portal: every page under this group is rendered only
 * for a signed-in user, and the shell — rail, navbar, footer — exists only for
 * a signed-in user too. A page that forgets to ask for the user still cannot
 * leak, because it never renders at all.
 */
/**
 * Every page here is gated on the session cookie, so there is nothing to
 * prerender: the route is intentionally blocking rather than shell-first.
 */
export const instant = false;

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return <AppLayoutShell>{children}</AppLayoutShell>;
}
