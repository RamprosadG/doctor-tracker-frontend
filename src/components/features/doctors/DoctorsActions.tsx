"use client";

import Button from "@/components/ui/buttons/Button";
import { IoPersonAddOutline } from "react-icons/io5";

interface DoctorsActionsProps {
  onCreate: () => void;
}

/** The header action for the doctors page. Only one, so the list keeps its own
 *  row and the button stays where the eye goes looking for it. */
export default function DoctorsActions({ onCreate }: DoctorsActionsProps) {
  return (
    <Button
      icon={<IoPersonAddOutline className="h-4 w-4" />}
      onClick={onCreate}
      className="max-sm:w-full"
    >
      Add Doctor
    </Button>
  );
}
