"use client";

import { useBooking } from "./BookingProvider";
import type { PackageId } from "@/lib/packages";

// Opens the party request form, optionally pre-selecting a specific package.
export default function PartyRequestButton({
  pkg,
  label = "Request a Party",
  className = "btn btn-magenta",
}: {
  pkg?: PackageId;
  label?: string;
  className?: string;
}) {
  const { openParty } = useBooking();
  return (
    <button type="button" className={className} onClick={() => openParty(pkg)}>
      {label}
    </button>
  );
}
