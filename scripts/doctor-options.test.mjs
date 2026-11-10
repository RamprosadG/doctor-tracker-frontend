import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DropdownModule from "../src/components/ui/dropdowns/Dropdown.tsx";
import PatientFormModalModule from "../src/components/features/patients/PatientFormModal.tsx";
import PatientsFiltersModule from "../src/components/features/patients/PatientsFilters.tsx";
import { loadDoctorOptions } from "../src/lib/doctors-client.ts";

// tsx exposes TSX default exports through CommonJS in this package's Node tests.
const Dropdown = DropdownModule.default ?? DropdownModule;
const PatientFormModal = PatientFormModalModule.default ?? PatientFormModalModule;
const PatientsFilters = PatientsFiltersModule.default ?? PatientsFiltersModule;

const doctor = { id: "off-page", name: "Zara Assigned", specialization: "Cardiology" };
const filterOptions = {
  conditions: ["Asthma"],
  doctors: [{ id: "first-page", name: "Alice First", specialization: "General" }],
};
const patient = {
  id: "patient-1", name: "Test Patient", phone: "1234567890", gender: "female",
  age: 30, condition: "Asthma", visitDate: "2026-01-10T00:00:00.000Z",
  doctorId: doctor.id, doctor,
};
const noop = () => {};

function response(items, hasNextPage) {
  return Response.json({
    success: true,
    data: { items, meta: { page: 1, pageSize: 20, totalItems: items.length, totalPages: 1, hasNextPage } },
  });
}

test("doctor options request one bounded page with the caller's abort signal", async (t) => {
  const controller = new AbortController();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls++;
    const parsed = new URL(url);
    assert.ok(parsed.pathname.endsWith("/doctors/options"));
    assert.equal(parsed.searchParams.get("page"), "1");
    assert.equal(parsed.searchParams.get("pageSize"), "20");
    assert.equal(parsed.searchParams.has("search"), false);
    assert.equal(init.signal, controller.signal);
    assert.equal(init.credentials, "include");
    return response([doctor], true);
  });

  assert.deepEqual(await loadDoctorOptions({ search: "  ", page: 1 }, controller.signal), {
    options: [{ value: doctor.id, label: doctor.name }], hasNextPage: true,
  });
  assert.equal(calls, 1, "a next page is never fetched automatically");
});

test("explicit later pages preserve the literal prefix and server pagination", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("page"), "3");
    assert.equal(parsed.searchParams.get("pageSize"), "20");
    assert.equal(parsed.searchParams.get("search"), "Dr. A & B");
    return response([doctor], false);
  });
  assert.deepEqual(await loadDoctorOptions(
    { search: "  Dr. A & B  ", page: 3 }, new AbortController().signal,
  ), { options: [{ value: doctor.id, label: doctor.name }], hasNextPage: false });
});

test("failed option reads reject and a retry can return an empty last page", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => ++calls === 1
    ? Response.json({ success: false, message: "Unavailable" }, { status: 503 })
    : response([], false));
  const query = { search: "Nobody", page: 1 };
  const signal = new AbortController().signal;
  await assert.rejects(loadDoctorOptions(query, signal), { statusCode: 503 });
  assert.deepEqual(await loadDoctorOptions(query, signal), { options: [], hasNextPage: false });
  assert.equal(calls, 2);
});

test("aborting an option read cancels its fetch", async (t) => {
  const controller = new AbortController();
  let aborted = false;
  t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      aborted = true;
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  }));
  const pending = loadDoctorOptions({ search: "Za", page: 1 }, controller.signal);
  controller.abort();
  await assert.rejects(pending);
  assert.equal(aborted, true);
});

test("remote dropdown SSR keeps its initial selected label without fetching", () => {
  let calls = 0;
  const html = renderToStaticMarkup(React.createElement(Dropdown, {
    options: [{ value: doctor.id, label: doctor.name }], value: doctor.id,
    ariaLabel: "Filter by doctor", searchable: true, onChange: noop,
    loadOptions: async () => { calls++; return { options: [], hasNextPage: false }; },
  }));
  assert.match(html, /Zara Assigned/);
  assert.match(html, /aria-label="Filter by doctor"/);
  assert.match(html, /aria-expanded="false"/);
  assert.equal(calls, 0);
});

test("patient filters render All doctors and an off-page selected SSR label", (t) => {
  t.mock.method(globalThis, "fetch", () => assert.fail("SSR must not fetch doctor pages"));
  const render = (doctorId) => renderToStaticMarkup(React.createElement(PatientsFilters, {
    query: { page: 1, pageSize: 20, doctorId },
    filterOptions: { ...filterOptions, doctors: [...filterOptions.doctors, doctor] },
    onChange: noop, onReset: noop,
  }));
  assert.match(render(undefined), /All doctors/);
  assert.match(render(doctor.id), /Zara Assigned/);
});

test("editing seeds only the actual off-page assignment; pinned rosters do not fetch", (t) => {
  t.mock.method(globalThis, "fetch", () => assert.fail("closed or pinned doctor fields must not fetch"));
  const render = (props) => renderToStaticMarkup(React.createElement(PatientFormModal, {
    isOpen: true, patient: null, filterOptions, onClose: noop, onSaved: noop, ...props,
  }));
  const assigned = render({ patient });
  assert.match(assigned, /Zara Assigned/);
  assert.doesNotMatch(assigned, /Doctor no longer listed/);
  assert.doesNotMatch(assigned, /All doctors/);
  assert.match(render({ patient: { ...patient, doctor: null } }), /Doctor no longer listed/);
  const pinned = render({ rosterDoctorId: "first-page" });
  assert.match(pinned, /id="patient-doctor"[^>]*disabled=""/);
  assert.match(pinned, /Alice First/);
  const empty = render({});
  assert.match(empty, /Select a doctor/);
  assert.doesNotMatch(empty, /All doctors/);
});
