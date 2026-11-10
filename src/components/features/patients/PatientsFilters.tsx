"use client";

import Dropdown from "@/components/ui/dropdowns/Dropdown";
import FilterBar from "@/components/ui/filters/FilterBar";
import Input from "@/components/ui/inputs/Input";
import SearchInput from "@/components/ui/inputs/SearchInput";
import Button from "@/components/ui/buttons/Button";
import { withAllOption } from "@/types/doctor";
import { genderOptions } from "@/types/patient";
import { PATIENT_SORT_OPTIONS, hasQueryState } from "@/lib/patient-query";
import { IoRefreshOutline } from "react-icons/io5";
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
  onReset: () => void;
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
 */
export default function PatientsFilters({
  query,
  filterOptions,
  onChange,
  onReset,
}: PatientsFiltersProps) {
  const conditionChoices = withAllOption("All conditions", filterOptions.conditions);
  // The value a doctor choice carries is its identifier, not its name: two
  // doctors can be called the same thing, and the API filters by id.
  const doctorChoices = [
    { value: "", label: "All doctors" },
    ...filterOptions.doctors.map((doctor) => ({ value: doctor.id, label: doctor.name })),
  ];
  const genderChoices = [{ value: "", label: "All genders" }, ...genderOptions];
  const isFiltered = hasQueryState(query);

  return (
    <div className="flex w-full flex-col gap-3">
      <FilterBar>
        <SearchInput
          value={query.search ?? ""}
          placeholder="Search name, phone or email"
          onDebouncedChange={(value) => onChange({ search: value.trim() || undefined })}
        />

        <Dropdown
          options={conditionChoices}
          value={query.condition ?? ""}
          onChange={(value) => onChange({ condition: value || undefined })}
        />

        <Dropdown
          options={doctorChoices}
          value={query.doctorId ?? ""}
          onChange={(value) => onChange({ doctorId: value || undefined })}
        />

        <Dropdown
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
      </FilterBar>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-9">
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              icon={<IoRefreshOutline className="h-4 w-4" />}
              onClick={onReset}
            >
              Reset filters
            </Button>
          )}
        </div>

        <div className="w-56 max-sm:w-full">
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
