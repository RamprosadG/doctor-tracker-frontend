import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchSessionUser } from "../src/lib/auth-client.ts";

const user = { id: "qa-user", name: "QA User", email: "qa@clinic.test", role: "admin" };

test("bootstrap callers share one non-aborted request and later calls revalidate", async (t) => {
  let resolveResponse;
  let calls = 0;
  t.mock.method(globalThis, "fetch", (_url, options) => {
    calls++;
    assert.equal(options.credentials, "include");
    assert.equal(options.signal, undefined);
    return new Promise((resolve) => { resolveResponse = resolve; });
  });

  const first = fetchSessionUser();
  const second = fetchSessionUser();
  assert.equal(first, second);
  assert.equal(calls, 1);
  resolveResponse(Response.json({ success: true, data: { user } }));
  assert.deepEqual(await Promise.all([first, second]), [user, user]);

  const next = fetchSessionUser();
  assert.equal(calls, 2);
  resolveResponse(Response.json({ success: true, data: { user } }));
  assert.deepEqual(await next, user);
});

test("a failed bootstrap is shared but never cached permanently", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return calls === 1
      ? Response.json({ success: false, message: "Unavailable" }, { status: 503 })
      : Response.json({ success: true, data: { user } });
  });
  const first = fetchSessionUser();
  const second = fetchSessionUser();
  assert.equal(first, second);
  await assert.rejects(first, { statusCode: 503 });
  await assert.rejects(second, { statusCode: 503 });
  assert.deepEqual(await fetchSessionUser(), user);
  assert.equal(calls, 2);
});
