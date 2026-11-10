"use client";

import Button from "@/components/ui/buttons/Button";
import { IoPersonAddOutline } from "react-icons/io5";

interface PatientsActionsProps {
  onCreate: () => void;
}

/** The header action for the patients page. Only one, so the list keeps its own
 *  row and the button stays where the eye goes looking for it. */
export default function PatientsActions({ onCreate }: PatientsActionsProps) {
  return (
    <Button
      icon={<IoPersonAddOutline className="h-4 w-4" />}
      onClick={onCreate}
      className="max-sm:w-full"
    >
      Add Patient
    </Button>
  );
}
