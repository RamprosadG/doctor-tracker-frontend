"use client";

import Dropdown from "@/components/ui/dropdowns/Dropdown";
import Input from "@/components/ui/inputs/Input";
import SearchInput from "@/components/ui/inputs/SearchInput";
import { withAllOption } from "@/types/doctor";
import { genderOptions } from "@/types/patient";
import { PATIENT_SORT_OPTIONS } from "@/lib/patient-query";
import { loadDoctorOptions } from "@/lib/doctors-client";
import type {
  PatientFilterOptions,
  PatientGender,
  PatientListQuery,
  PatientSort,
} from "@/types/patient";

interface PatientsFiltersProps {
  /** The filters currently in the address bar — the single source of truth. */
  query: PatientListQuery;
  filterOptions: PatientFilterOptions;
  onChange: (patch: Partial<PatientListQuery>) => void;
}

/**
 * The six filters the patients endpoint understands. Each one writes itself
 * into the address bar rather than into local state, so a filtered list is
 * linkable, survives a reload and answers to the back button.
 *
 * The condition and doctor choices both come from the API. Neither is a
 * hardcoded list: the portal can only offer what the practice has actually
 * stored, and a condition somebody types is free text the dropdown would never
 * have guessed.
 *
 * Layout:
 *   Desktop — Row 1: Condition | Doctor | Gender | Visited from | Visited to (5-col)
 *             Row 2: Search (flex-grow, no label) + Sort (fixed, label above)
 *   Mobile  — Row 1: Condition (full width)
 *             Row 2: Doctor | Gender
 *             Row 3: Visited from | Visited to
 *             Row 4: Search | Sort
 */
export default function PatientsFilters({
  query,
  filterOptions,
  onChange
}: PatientsFiltersProps) {
  const conditionChoices = withAllOption("All conditions", filterOptions.conditions);
  // The value a doctor choice carries is its identifier, not its name: two
  // doctors can be called the same thing, and the API filters by id.
  const doctorChoices = [
    { value: "", label: "All doctors" },
    ...filterOptions.doctors.map((doctor) => ({ value: doctor.id, label: doctor.name })),
  ];
  const genderChoices = [{ value: "", label: "All genders" }, ...genderOptions];

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Row 1 — mobile: Condition full-width; desktop: all 5 dropdowns in one row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {/* Condition: full-width on mobile (col-span-2), 1 col on desktop */}
        <div className="col-span-2 md:col-span-1">
          <Dropdown
            label="Condition"
            hideOptionalText
            options={conditionChoices}
            value={query.condition ?? ""}
            onChange={(value) => onChange({ condition: value || undefined })}
          />
        </div>

        <Dropdown
          label="Doctor"
          hideOptionalText
          ariaLabel="Filter by doctor"
          searchable
          searchPlaceholder="Search doctors..."
          searchLabel="Search doctors by name prefix"
          loadOptions={loadDoctorOptions}
          options={doctorChoices}
          value={query.doctorId ?? ""}
          onChange={(value) => onChange({ doctorId: value || undefined })}
        />

        <Dropdown
          label="Gender"
          hideOptionalText
          options={genderChoices}
          value={query.gender ?? ""}
          onChange={(value) => onChange({ gender: (value || undefined) as PatientGender | undefined })}
        />

        <Input
          id="patient-visit-from"
          name="patient-visit-from"
          type="date"
          label="Visited from"
          hideOptionalText
          value={query.from ?? ""}
          onChange={(event) => onChange({ from: event.target.value || undefined })}
        />

        <Input
          id="patient-visit-to"
          name="patient-visit-to"
          type="date"
          label="Visited to"
          hideOptionalText
          value={query.to ?? ""}
          onChange={(event) => onChange({ to: event.target.value || undefined })}
        />
      </div>

      {/* Row 2 — Search (left, flex-grow, no label) + Sort (right, fixed, label above) */}
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={query.search ?? ""}
            placeholder="Search name, phone or email"
            onDebouncedChange={(value) => onChange({ search: value.trim() || undefined })}
          />
        </div>
        <div className="w-44 shrink-0">
          <Dropdown
            id="patient-sort"
            label="Sort by"
            hideOptionalText
            options={PATIENT_SORT_OPTIONS}
            value={query.sort ?? "-visitDate"}
            onChange={(value) => onChange({ sort: value as PatientSort })}
          />
        </div>
      </div>
    </div>
  );
}
