"use client";

import Button from "@/components/ui/buttons/Button";
import Dropdown from "@/components/ui/dropdowns/Dropdown";
import FilterBar from "@/components/ui/filters/FilterBar";
import Input from "@/components/ui/inputs/Input";
import SearchInput from "@/components/ui/inputs/SearchInput";
import { IoRefreshOutline } from "react-icons/io5";
import { PATIENT_SORT_OPTIONS, hasQueryState } from "@/lib/patient-query";
import type { PatientListQuery, PatientSort } from "@/types/patient";

interface DoctorRosterFiltersProps {
  /** The filters this roster's address bar carries. */
  query: PatientListQuery;
  onChange: (patch: Partial<PatientListQuery>) => void;
  onReset: () => void;
}

/**
 * The narrower half of the patients filter bar. Who the patient is and when
 * they were last seen stay, because a roster needs both; the doctor choice does
 * not exist here, since the page is already about one doctor, and neither does
 * condition or gender, which are comparisons across the clinic rather than
 * within one list.
 */
export default function DoctorRosterFilters({
  query,
  onChange,
  onReset,
}: DoctorRosterFiltersProps) {
  const isFiltered = hasQueryState(query);

  return (
    <div className="flex w-full flex-col gap-3">
      <FilterBar>
        <SearchInput
          value={query.search ?? ""}
          placeholder="Search name, phone or email"
          onDebouncedChange={(value) => onChange({ search: value.trim() || undefined })}
        />

        <Input
          id="roster-visit-from"
          name="roster-visit-from"
          type="date"
          label="Visited from"
          hideOptionalText
          value={query.from ?? ""}
          onChange={(event) => onChange({ from: event.target.value || undefined })}
        />

        <Input
          id="roster-visit-to"
          name="roster-visit-to"
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
            id="roster-sort"
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
