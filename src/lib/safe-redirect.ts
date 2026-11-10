export function safeRedirectTarget(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";

  try {
    const base = "http://localhost";
    const target = new URL(value, base);
    if (target.origin !== base || /^\/login\/?$/.test(target.pathname)) return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}
