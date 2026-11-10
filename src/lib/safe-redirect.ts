/**
 * Only same-origin paths are accepted as a redirect target: `//host` and
 * `/\host` are both read as protocol-relative by browsers, which would turn
 * `?next=` into an open redirect.
 */
export function safeRedirectTarget(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
