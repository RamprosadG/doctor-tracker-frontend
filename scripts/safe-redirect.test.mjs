import assert from "node:assert/strict";
import { test } from "node:test";
import { safeRedirectTarget } from "../src/lib/safe-redirect.ts";

for (const value of [
  undefined,
  null,
  "",
  "doctors",
  "https://example.invalid",
  "//example.invalid",
  "/\\example.invalid",
  "/\t/example.invalid",
  "/\n/example.invalid",
  "/\r/example.invalid",
  "/\t/[invalid",
  "/login",
  "/login?next=/patients",
  "/login/",
  "/doctors/../login",
]) {
  test(`rejects unsafe or self-referencing target ${JSON.stringify(value)}`, () => {
    assert.equal(safeRedirectTarget(value), "/");
  });
}

for (const value of ["/", "/doctors?page=2&pageSize=5", "/patients?search=QA#results"]) {
  test(`preserves local target ${value}`, () => {
    assert.equal(safeRedirectTarget(value), value);
  });
}

test("normalizes a path before returning it", () => {
  assert.equal(safeRedirectTarget("/doctors/../patients?page=2"), "/patients?page=2");
});
