"use client";

import { useMemo, useState, type FormEvent } from "react";
import Button from "@/components/ui/buttons/Button";
import Dropdown from "@/components/ui/dropdowns/Dropdown";
import Input from "@/components/ui/inputs/Input";
import Modal from "@/components/ui/modals/Modal";
import { showErrorAlert, showSuccessAlert } from "@/components/ui/alerts/Alerts";
import { createDoctor, updateDoctor } from "@/lib/doctors-client";
import { apiFieldErrors, apiMessage } from "@/lib/api-client";
import { SPECIALIZATIONS, type Doctor, type DoctorPayload } from "@/types/doctor";
import type { FieldErrors } from "@/types/api";

interface DoctorFormModalProps {
  isOpen: boolean;
  /** The record being edited; `null` opens the form empty, for a new doctor. */
  doctor: Doctor | null;
  onClose: () => void;
  /** Called after a successful write, so the list revalidates and closes. */
  onSaved: () => void;
}

const EMPTY_FORM: DoctorPayload = {
  name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: "",
};

/** In step with `createDoctorSchema` on the server, so a typo is caught before
 *  the request. The messages are that schema's own strings, which means a field
 *  reads identically however it came to be wrong. */
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateForm(values: DoctorPayload): FieldErrors {
  const errors: FieldErrors = {};

  const name = values.name.trim();
  if (name.length < 2) errors.name = "Doctor name must be at least 2 characters.";
  else if (name.length > 120) errors.name = "Doctor name must be 120 characters or fewer.";

  const specialization = values.specialization.trim();
  if (specialization.length < 2) errors.specialization = "Specialization is required.";
  else if (specialization.length > 120) {
    errors.specialization = "Specialization must be 120 characters or fewer.";
  }

  const hospital = values.hospital.trim();
  if (hospital.length < 2) errors.hospital = "Hospital is required.";
  else if (hospital.length > 160) errors.hospital = "Hospital must be 160 characters or fewer.";

  if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "Provide a valid phone number (digits, optional leading +).";
  }

  const email = values.email.trim();
  if (email.length > 320) errors.email = "Email must be 320 characters or fewer.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Provide a valid email address.";

  return errors;
}

/** `Doctor` also carries the identifier, the joined count and the timestamps,
 *  none of which belong in the form. */
const toFormValues = (doctor: Doctor | null): DoctorPayload =>
  doctor
    ? {
        name: doctor.name,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        phone: doctor.phone,
        email: doctor.email,
      }
    : EMPTY_FORM;

/**
 * Mounted only while the dialog is open, which is what lets the form seed
 * itself once on mount instead of watching the record for changes: a reopened
 * dialog is a new component instance, so it cannot carry over a previous
 * doctor's values or a stale validation message.
 */
function DoctorForm({
  doctor,
  onClose,
  onSaved,
}: Pick<DoctorFormModalProps, "doctor" | "onClose" | "onSaved">) {
  const [values, setValues] = useState<DoctorPayload>(() => toFormValues(doctor));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specializationChoices = useMemo(() => {
    const choices = SPECIALIZATIONS.map((value) => ({ value, label: value }));
    if (!doctor) return choices;

    // A record whose specialization is not in the curated list still has to
    // display it, or the dialog would open showing a placeholder over a value
    // that is actually stored.
    return choices.some((choice) => choice.value === doctor.specialization)
      ? choices
      : [{ value: doctor.specialization, label: doctor.specialization }, ...choices];
  }, [doctor]);

  const setValue = (field: keyof DoctorPayload, value: string): void => {
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

    const payload: DoctorPayload = {
      name: values.name.trim(),
      specialization: values.specialization.trim(),
      hospital: values.hospital.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
    };

    setIsSubmitting(true);
    try {
      const saved = doctor
        ? await updateDoctor(doctor.id, payload)
        : await createDoctor(payload);

      showSuccessAlert(
        doctor
          ? `${saved.name} was updated.`
          : `${saved.name} was added to the practice.`,
      );
      onSaved();
    } catch (error) {
      setErrors(apiFieldErrors(error) ?? {});
      showErrorAlert(apiMessage(error, "The doctor could not be saved."));
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
            id="doctor-name"
            name="doctor-name"
            label="Doctor name"
            required
            value={values.name}
            error={errors.name}
            onChange={(event) => setValue("name", event.target.value)}
          />
        </div>

        <Dropdown
          id="doctor-specialization"
          name="doctor-specialization"
          label="Specialization"
          required
          placeholder="Select a specialization"
          options={specializationChoices}
          value={values.specialization}
          error={errors.specialization}
          onChange={(value) => setValue("specialization", value)}
        />

        <Input
          id="doctor-hospital"
          name="doctor-hospital"
          label="Hospital"
          required
          placeholder="Where this doctor practises"
          value={values.hospital}
          error={errors.hospital}
          onChange={(event) => setValue("hospital", event.target.value)}
        />

        <Input
          id="doctor-phone"
          name="doctor-phone"
          type="tel"
          label="Phone"
          required
          placeholder="+1 555 0142"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => setValue("phone", event.target.value)}
        />

        <Input
          id="doctor-email"
          name="doctor-email"
          type="email"
          label="Email"
          required
          placeholder="doctor@hospital.org"
          value={values.email}
          error={errors.email}
          onChange={(event) => setValue("email", event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {doctor ? "Save Changes" : "Create New"}
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
export default function DoctorFormModal({
  isOpen,
  doctor,
  onClose,
  onSaved,
}: DoctorFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doctor ? "Edit Doctor" : "Add Doctor"}
    >
      <DoctorForm doctor={doctor} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
