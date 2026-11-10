import Link from "next/link";
import { notFound } from "next/navigation";
import DoctorDetailView from "./DoctorDetailView";
import { ApiError, apiMessage, apiPrimaryError } from "@/lib/api-client";
import { readPatientQuery } from "@/lib/patient-query";
import { fetchDoctorDetail, fetchDoctorRoster } from "@/lib/doctors-server";
import { buildPaginationMeta, toSearchParams, type SearchParamsInput } from "@/lib/utils";
import type { PaginatedPayload } from "@/types/api";
import type { Doctor } from "@/types/doctor";
import type { Patient, PatientListQuery } from "@/types/patient";

interface DoctorDetailContentProps {
  /** Read here rather than in the page, so the identifier arrives with every
   *  other part of this render inside the same `Suspense` boundary. */
  params: Promise<{ id: string }>;
  searchParams: SearchParamsInput;
}

type DoctorDetailRead =
  /** The address bar cannot name a doctor: not a failure, a page that is not there. */
  | { kind: "unknown" }
  /** The doctor is there in principle and the cluster could not say so. */
  | { kind: "unreachable"; error: unknown }
  | {
      kind: "read";
      doctor: Doctor;
      list: PaginatedPayload<Patient>;
      effectiveQuery: PatientListQuery;
      loadError?: string;
    };

/**
 * The doctor and their roster, read together because both belong to this one
 * render. The roster call is made against the doctor from the url, so a
 * hand-edited `?doctorId=` cannot change whose patients are listed — the API
 * overwrites it, and this page never offers it as a filter.
 *
 * A result rather than a throw, because the caller has three different answers
 * and one of them is `notFound()`, which must not be swallowed here.
 */
async function readDoctorDetail(
  doctorId: string,
  query: PatientListQuery,
): Promise<DoctorDetailRead> {
  const [detailResult, listResult] = await Promise.allSettled([
    fetchDoctorDetail(doctorId),
    fetchDoctorRoster(doctorId, query),
  ]);

  if (detailResult.status === "rejected") {
    const isUnknownId =
      detailResult.reason instanceof ApiError &&
      (detailResult.reason.statusCode === 404 || detailResult.reason.statusCode === 400);

    return isUnknownId ? { kind: "unknown" } : { kind: "unreachable", error: detailResult.reason };
  }

  const doctor = detailResult.value;

  if (listResult.status === "fulfilled") {
    return {
      kind: "read",
      doctor,
      list: listResult.value,
      // The API clamps a page past the last one, and the view has to push the
      // page it actually showed.
      effectiveQuery: {
        ...query,
        page: listResult.value.meta.page,
        pageSize: listResult.value.meta.pageSize,
      },
    };
  }

  // An unreadable roster is still a doctor's page: the header, the filters and
  // the reason the rows did not arrive make a usable screen.
  return {
    kind: "read",
    doctor,
    list: { items: [], meta: buildPaginationMeta(query.page, query.pageSize, 0) },
    effectiveQuery: query,
    loadError: apiPrimaryError(listResult.reason, "This roster could not be loaded."),
  };
}

/**
 * Reads the doctor and the first page of their roster on the server, so both are
 * in the HTML the browser receives before any script runs.
 */
export default async function DoctorDetailContent({
  params,
  searchParams,
}: DoctorDetailContentProps) {
  const { id: doctorId } = await params;
  const query = readPatientQuery(toSearchParams(await searchParams));
  const read = await readDoctorDetail(doctorId, query);

  if (read.kind === "unknown") notFound();

  if (read.kind === "unreachable") {
    return (
      <div className="flex w-full flex-col gap-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiMessage(read.error, "This doctor could not be loaded. Check that the API is reachable.")}
        </p>
        <Link
          href="/doctors"
          className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          Back to the doctors list
        </Link>
      </div>
    );
  }

  return (
    <DoctorDetailView
      doctor={read.doctor}
      query={read.effectiveQuery}
      list={read.list}
      loadError={read.loadError}
    />
  );
}
