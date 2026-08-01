"use client";

import { useBooking } from "./BookingProvider";

// Client button that opens the private-lesson / private-class inquiry modal.
// Usable from any (server) page.
export default function BookLessonButton({
  label = "Book a Private Lesson",
  className = "btn btn-magenta",
}: {
  label?: string;
  className?: string;
}) {
  const { openLesson } = useBooking();
  return (
    <button type="button" className={className} onClick={openLesson}>
      {label}
    </button>
  );
}
