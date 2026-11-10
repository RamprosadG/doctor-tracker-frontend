"use client";

import { useMemo, useState, type FormEvent } from "react";
import Button from "@/components/ui/buttons/Button";
import Dropdown from "@/components/ui/dropdowns/Dropdown";
import Input from "@/components/ui/inputs/Input";
import Modal from "@/components/ui/modals/Modal";
import Textarea from "@/components/ui/inputs/Textarea";
import { showErrorAlert, showSuccessAlert } from "@/components/ui/alerts/Alerts";
import { createPatient, createRosterPatient, updatePatient } from "@/lib/patients-client";
import { apiFieldErrors, apiMessage } from "@/lib/api-client";
import {
  COMMON_CONDITIONS,
  genderOptions,
  type Patient,
  type PatientFilterOptions,
  type PatientPayload,
} from "@/types/patient";
import type { FieldErrors } from "@/types/api";

interface PatientFormModalProps {
  isOpen: boolean;
  /** The record being edited; `null` opens the form empty, for a new patient. */
  patient: Patient | null;
  /** The assignable doctors and the stored conditions, from the same read that
   *  fills the filter row, so the form and the filters never disagree. */
  filterOptions: PatientFilterOptions;
  /** Set on a doctor's own page. The assignment then comes from the url: the
   *  field is fixed to that doctor and a new record is written through the
   *  nested route, so nothing this form sends can move the patient elsewhere. */
  rosterDoctorId?: string;
  onClose: () => void;
  /** Called after a successful write, so the list revalidates and closes. */
  onSaved: () => void;
}

/** Every field as a string, because that is what an input hands back; the age
 *  becomes a number and the visit date a timestamp only in the payload. */
interface PatientFormValues {
  name: string;
  phone: string;
  email: string;
  gender: string;
  age: string;
  condition: string;
  notes: string;
  visitDate: string;
  doctorId: string;
}

const EMPTY_FORM: PatientFormValues = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  age: "",
  condition: "",
  notes: "",
  visitDate: "",
  doctorId: "",
};

/** In step with `createPatientSchema` on the server, so a typo is caught before
 *  the request. The messages are that schema's own strings, which means a field
 *  reads identically however it came to be wrong. */
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(values: PatientFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const name = values.name.trim();
  if (name.length < 2) errors.name = "Patient name must be at least 2 characters.";
  else if (name.length > 120) errors.name = "Patient name must be 120 characters or fewer.";

  if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "Provide a valid phone number (digits, optional leading +).";
  }

  const email = values.email.trim();
  if (email.length > 320) errors.email = "Email must be 320 characters or fewer.";
  else if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "Provide a valid email address.";
  }

  if (!values.gender) errors.gender = "Gender must be male, female or other.";

  const age = Number(values.age);
  if (!values.age.trim() || !Number.isInteger(age)) errors.age = "Age must be a whole number.";
  else if (age < 0) errors.age = "Age cannot be negative.";
  else if (age > 130) errors.age = "Age must be 130 or lower.";

  const condition = values.condition.trim();
  if (!condition) errors.condition = "Medical condition is required.";
  else if (condition.length > 200) {
    errors.condition = "Condition must be 200 characters or fewer.";
  }

  if (values.notes.trim().length > 2000) {
    errors.notes = "Notes must be 2000 characters or fewer.";
  }

  // Blank is allowed: the server files the visit as of now.
  if (values.visitDate.trim() && Number.isNaN(new Date(values.visitDate).getTime())) {
    errors.visitDate = "Provide a valid visit date.";
  }

  if (!values.doctorId) errors.doctorId = "A patient must be assigned to a doctor.";

  return errors;
}

/** A date input takes a calendar day, so the stored timestamp is shown as the
 *  day it falls on where the reader is — the same day the table's "Last visit"
 *  cell prints, not the UTC day that may sit one either side of it. */
function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const toFormValues = (
  patient: Patient | null,
  rosterDoctorId?: string,
): PatientFormValues =>
  patient
    ? {
        name: patient.name,
        phone: patient.phone,
        email: patient.email ?? "",
        gender: patient.gender,
        age: String(patient.age),
        condition: patient.condition,
        notes: patient.notes ?? "",
        visitDate: toDateInputValue(patient.visitDate),
        doctorId: patient.doctorId,
      }
    : { ...EMPTY_FORM, doctorId: rosterDoctorId ?? "" };

/**
 * Mounted only while the dialog is open, which is what lets the form seed
 * itself once on mount instead of watching the record for changes: a reopened
 * dialog is a new component instance, so it cannot carry over a previous
 * patient's values or a stale validation message.
 */
function PatientForm({
  patient,
  filterOptions,
  rosterDoctorId,
  onClose,
  onSaved,
}: Pick<
  PatientFormModalProps,
  "patient" | "filterOptions" | "rosterDoctorId" | "onClose" | "onSaved"
>) {
  const [values, setValues] = useState<PatientFormValues>(() => toFormValues(patient, rosterDoctorId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctorChoices = useMemo(() => {
    // On a doctor's own page the assignment is the url, so the field offers that
    // one name: the choice a reader cannot change is not worth a list.
    if (rosterDoctorId) {
      return [
        {
          value: rosterDoctorId,
          label:
            filterOptions.doctors.find((doctor) => doctor.id === rosterDoctorId)?.name ??
            patient?.doctor?.name ??
            "This doctor",
        },
      ];
    }

    const choices = filterOptions.doctors.map((doctor) => ({
      value: doctor.id,
      label: doctor.name,
    }));
    const assigned = values.doctorId;
    if (!assigned || choices.some((choice) => choice.value === assigned)) return choices;

    // A patient whose doctor record is gone still has to show what is stored,
    // or the dialog would open looking unassigned while holding an identifier.
    return [
      { value: assigned, label: patient?.doctor?.name ?? "Doctor no longer listed" },
      ...choices,
    ];
  }, [filterOptions.doctors, patient?.doctor?.name, rosterDoctorId, values.doctorId]);

  const setValue = (field: keyof PatientFormValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const found = validateForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const name = values.name.trim();
    const phone = values.phone.trim();
    const condition = values.condition.trim();
    const visitDate = values.visitDate.trim();

    // A blank optional field is sent as an empty string, not left out: JSON
    // drops an `undefined`, which the server would read as "this field was not
    // touched". The empty string is what its schema preprocesses into the
    // `$unset` that clears an email or a note. `visitDate` is the exception —
    // the server has no blank-means-clear rule for a date, so it is omitted.
    const payload: PatientPayload = {
      name,
      phone,
      email: values.email.trim().toLowerCase(),
      gender: values.gender as PatientPayload["gender"],
      age: Number(values.age),
      condition,
      notes: values.notes.trim(),
      visitDate: visitDate || undefined,
      doctorId: values.doctorId,
    };

    setIsSubmitting(true);
    try {
      // On a roster page the write goes to the nested route, whose url already
      // names the doctor. The body still carries the field the form set, and the
      // API has no slot for it: the path is the assignment, which is what the
      // probe that pins a conflicting body proves.
      const saved = patient
        ? await updatePatient(patient.id, payload)
        : rosterDoctorId
          ? await createRosterPatient(rosterDoctorId, payload)
          : await createPatient(payload);

      showSuccessAlert(
        patient ? `${saved.name} was updated.` : `${saved.name} was added to the practice.`,
      );
      onSaved();
    } catch (error) {
      setErrors(apiFieldErrors(error) ?? {});
      showErrorAlert(apiMessage(error, "The patient could not be saved."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // `noValidate` because the messages worth reading are this form's own, which
    // are the server schema's word for word: a browser bubble would stop the
    // submit before them and say the same thing in the operating system's voice.
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="patient-name"
            name="patient-name"
            label="Patient name"
            required
            value={values.name}
            error={errors.name}
            onChange={(event) => setValue("name", event.target.value)}
          />
        </div>

        <Input
          id="patient-phone"
          name="patient-phone"
          type="tel"
          label="Phone"
          required
          placeholder="+1 555 0142"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => setValue("phone", event.target.value)}
        />

        <Input
          id="patient-email"
          name="patient-email"
          type="email"
          label="Email"
          placeholder="patient@example.com"
          value={values.email}
          error={errors.email}
          onChange={(event) => setValue("email", event.target.value)}
        />

        <Dropdown
          id="patient-gender"
          name="patient-gender"
          label="Gender"
          required
          placeholder="Select a gender"
          options={genderOptions}
          value={values.gender}
          error={errors.gender}
          onChange={(value) => setValue("gender", value)}
        />

        <Input
          id="patient-age"
          name="patient-age"
          type="number"
          label="Age"
          required
          min={0}
          max={130}
          value={values.age}
          error={errors.age}
          onChange={(event) => setValue("age", event.target.value)}
        />

        <div className="sm:col-span-2">
          <Input
            id="patient-condition"
            name="patient-condition"
            label="Medical condition"
            required
            list="patient-condition-choices"
            placeholder="Start typing, or pick a common condition"
            value={values.condition}
            error={errors.condition}
            onChange={(event) => setValue("condition", event.target.value)}
          />
          {/* A suggestion list, not a constraint: the field stays free text, so
              a condition the practice has not recorded before is still writable. */}
          <datalist id="patient-condition-choices">
            {COMMON_CONDITIONS.map((condition) => (
              <option key={condition} value={condition} />
            ))}
          </datalist>
        </div>

        <Dropdown
          id="patient-doctor"
          name="patient-doctor"
          label="Assigned doctor"
          required
          // Pinned on a roster page: the url already chose, so there is one name
          // to show and nothing to search through.
          searchable={!rosterDoctorId}
          disabled={Boolean(rosterDoctorId)}
          searchPlaceholder="Search doctors..."
          placeholder="Select a doctor"
          options={doctorChoices}
          value={values.doctorId}
          error={errors.doctorId}
          onChange={(value) => setValue("doctorId", value)}
        />

        <Input
          id="patient-visit-date"
          name="patient-visit-date"
          type="date"
          label="Visit date"
          placeholder="Leave blank for today"
          value={values.visitDate}
          error={errors.visitDate}
          onChange={(event) => setValue("visitDate", event.target.value)}
        />

        <div className="sm:col-span-2">
          <Textarea
            id="patient-notes"
            name="patient-notes"
            label="Notes"
            rows={3}
            placeholder="Anything worth remembering about this visit"
            value={values.notes}
            error={errors.notes}
            onChange={(event) => setValue("notes", event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {patient ? "Save Changes" : "Create New"}
        </Button>
      </div>
    </form>
  );
}

/**
 * One dialog for both writes: a create posts the whole record, an edit sends the
 * same fields as a patch onto the existing one. The submit label says which of
 * the two is happening, and a rejected write keeps the dialog open with the
 * server's field messages beside the inputs they came from.
 */
export default function PatientFormModal({
  isOpen,
  patient,
  filterOptions,
  rosterDoctorId,
  onClose,
  onSaved,
}: PatientFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patient ? "Edit Patient" : "Add Patient"}
    >
      <PatientForm
        patient={patient}
        filterOptions={filterOptions}
        rosterDoctorId={rosterDoctorId}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
