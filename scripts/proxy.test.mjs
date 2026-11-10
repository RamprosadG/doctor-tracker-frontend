import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server.js";
import proxyModule from "../src/proxy.ts";

const { default: proxy } = proxyModule;

for (const cookie of ["", "accessToken=stale", "refreshToken=stale", "accessToken=stale; refreshToken=stale"]) {
  test(`login remains reachable with ${cookie || "no cookies"}`, () => {
    const request = new NextRequest("http://localhost:3000/login?next=%2Fpatients", { headers: { cookie } });
    const response = proxy(request);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-middleware-request-x-request-path"), "/login?next=%2Fpatients");
  });
}

test("anonymous protected request preserves filters in next", () => {
  const response = proxy(new NextRequest("http://localhost:3000/patients?page=2&pageSize=5"));
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("next"), "/patients?page=2&pageSize=5");
});

test("cookie presence passes protected routes to the real server guard", () => {
  const response = proxy(new NextRequest("http://localhost:3000/patients?page=2", {
    headers: { cookie: "refreshToken=unverified", "x-request-path": "//example.invalid" },
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-middleware-request-x-request-path"), "/patients?page=2");
});
