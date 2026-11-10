"use client";

import Dropdown from "@/components/ui/dropdowns/Dropdown";
import FilterBar from "@/components/ui/filters/FilterBar";
import Input from "@/components/ui/inputs/Input";
import SearchInput from "@/components/ui/inputs/SearchInput";
import Button from "@/components/ui/buttons/Button";
import { withAllOption } from "@/types/doctor";
import {
  DOCTOR_SORT_OPTIONS,
  hasQueryState,
} from "@/lib/doctor-query";
import { IoRefreshOutline } from "react-icons/io5";
import type { DoctorFilterOptions, DoctorListQuery, DoctorSort } from "@/types/doctor";

interface DoctorsFiltersProps {
  /** The filters currently in the address bar — the single source of truth. */
  query: DoctorListQuery;
  filterOptions: DoctorFilterOptions;
  onChange: (patch: Partial<DoctorListQuery>) => void;
  onReset: () => void;
}

/**
 * The five filters the doctors endpoint understands. Each one writes itself
 * into the address bar rather than into local state, so a filtered list is
 * linkable, survives a reload and answers to the back button.
 */
export default function DoctorsFilters({
  query,
  filterOptions,
  onChange,
  onReset,
}: DoctorsFiltersProps) {
  const specializationChoices = withAllOption("All specializations", filterOptions.specializations);
  const hospitalChoices = withAllOption("All hospitals", filterOptions.hospitals);
  const isFiltered = hasQueryState(query);

  return (
    <div className="flex w-full flex-col gap-3">
      <FilterBar>
        <SearchInput
          value={query.search ?? ""}
          placeholder="Search name, specialization or hospital"
          onDebouncedChange={(value) => onChange({ search: value.trim() || undefined })}
        />

        <Dropdown
          options={specializationChoices}
          value={query.specialization ?? ""}
          onChange={(value) => onChange({ specialization: value || undefined })}
        />

        <Dropdown
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
