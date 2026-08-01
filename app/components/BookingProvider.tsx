"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { PackageId } from "@/lib/packages";
import BookingModal from "./BookingModal";
import PrivateLessonModal from "./PrivateLessonModal";

// Global booking context so any page/button can open the party-request or
// private-lesson modal without each page re-implementing modal state.
interface BookingCtx {
  /** Open the party request form, optionally pre-selecting a package. */
  openParty: (pkg?: PackageId) => void;
  /** Open the private-lesson inquiry form. */
  openLesson: () => void;
  close: () => void;
}

const BookingContext = createContext<BookingCtx | null>(null);

export function useBooking(): BookingCtx {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within <BookingProvider>");
  return ctx;
}

type ActiveModal = { type: "party"; pkg: PackageId } | { type: "lesson" } | null;

export default function BookingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modal, setModal] = useState<ActiveModal>(null);

  const openParty = useCallback(
    (pkg: PackageId = "fab-flow") => setModal({ type: "party", pkg }),
    []
  );
  const openLesson = useCallback(() => setModal({ type: "lesson" }), []);
  const close = useCallback(() => setModal(null), []);

  // Lock body scroll + close on Escape while a modal is open.
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modal, close]);

  return (
    <BookingContext.Provider value={{ openParty, openLesson, close }}>
      {children}
      {modal?.type === "party" && (
        <BookingModal initialPackage={modal.pkg} onClose={close} />
      )}
      {modal?.type === "lesson" && <PrivateLessonModal onClose={close} />}
    </BookingContext.Provider>
  );
}
