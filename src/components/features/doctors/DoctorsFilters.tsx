"use client";

import Dropdown from "@/components/ui/dropdowns/Dropdown";
import Input from "@/components/ui/inputs/Input";
import SearchInput from "@/components/ui/inputs/SearchInput";
import { withAllOption } from "@/types/doctor";
import {
  DOCTOR_SORT_OPTIONS,
} from "@/lib/doctor-query";
import type { DoctorFilterOptions, DoctorListQuery, DoctorSort } from "@/types/doctor";

interface DoctorsFiltersProps {
  /** The filters currently in the address bar — the single source of truth. */
  query: DoctorListQuery;
  filterOptions: DoctorFilterOptions;
  onChange: (patch: Partial<DoctorListQuery>) => void;
}

/**
 * The five filters the doctors endpoint understands. Each one writes itself
 * into the address bar rather than into local state, so a filtered list is
 * linkable, survives a reload and answers to the back button.
 *
 * Layout:
 *   Row 1 (mobile 2-col / desktop 4-col): Specialization | Hospital | Added from | Added to
 *   Row 2 (all viewports): Sort dropdown (fixed width, label above) + Search (flex-grow, no label)
 */
export default function DoctorsFilters({
  query,
  filterOptions,
  onChange,
}: DoctorsFiltersProps) {
  const specializationChoices = withAllOption("All specializations", filterOptions.specializations);
  const hospitalChoices = withAllOption("All hospitals", filterOptions.hospitals);

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Row 1: mobile → 2-col grid (spec + hospital | from + to); desktop → 4-col grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Dropdown
          label="Specialization"
          hideOptionalText
          options={specializationChoices}
          value={query.specialization ?? ""}
          onChange={(value) => onChange({ specialization: value || undefined })}
        />

        <Dropdown
          label="Hospital"
          hideOptionalText
          options={hospitalChoices}
          value={query.hospital ?? ""}
          onChange={(value) => onChange({ hospital: value || undefined })}
        />

        <Input
          id="doctor-added-from"
          name="doctor-added-from"
          type="date"
          label="Added from"
          hideOptionalText
          value={query.from ?? ""}
          onChange={(event) => onChange({ from: event.target.value || undefined })}
        />

        <Input
          id="doctor-added-to"
          name="doctor-added-to"
          type="date"
          label="Added to"
          hideOptionalText
          value={query.to ?? ""}
          onChange={(event) => onChange({ to: event.target.value || undefined })}
        />
      </div>

      {/* Row 2: Search (flex-grow, no label) + Sort (fixed, label above) — same line on all viewports */}
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={query.search ?? ""}
            placeholder="Search name, specialization or hospital"
            onDebouncedChange={(value) => onChange({ search: value.trim() || undefined })}
          />
        </div>
        <div className="w-44 shrink-0">
          <Dropdown
            id="doctor-sort"
            label="Sort by"
            hideOptionalText
            options={DOCTOR_SORT_OPTIONS}
            value={query.sort ?? "-createdAt"}
            onChange={(value) => onChange({ sort: value as DoctorSort })}
          />
        </div>
      </div>
    </div>
  );
}
