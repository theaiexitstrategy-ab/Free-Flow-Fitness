"use client";

import { useState, useEffect } from "react";
import type { PackageId } from "@/lib/packages";
import Header from "./Header";
import Hero from "./Hero";
import BookingPaths from "./BookingPaths";
import PartyPackages from "./PartyPackages";
import ClassesTeaser from "./ClassesTeaser";
import PrivateLesson from "./PrivateLesson";
import LocationContact from "./LocationContact";
import Footer from "./Footer";
import BookingModal from "./BookingModal";
import PrivateLessonModal from "./PrivateLessonModal";
import StatusBanner from "./StatusBanner";

type ActiveModal =
  | { type: "party"; pkg: PackageId }
  | { type: "lesson" }
  | null;

export default function Site() {
  const [modal, setModal] = useState<ActiveModal>(null);

  const openParty = (pkg: PackageId) => setModal({ type: "party", pkg });
  const openLesson = () => setModal({ type: "lesson" });
  const close = () => setModal(null);

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
  }, [modal]);

  return (
    <>
      <StatusBanner />
      <Header />
      <main>
        <Hero onBookLesson={openLesson} />
        <BookingPaths onBookLesson={openLesson} />
        <PartyPackages onBookParty={openParty} />
        <ClassesTeaser />
        <PrivateLesson onBookLesson={openLesson} />
        <LocationContact />
      </main>
      <Footer />

      {modal?.type === "party" && (
        <BookingModal initialPackage={modal.pkg} onClose={close} />
      )}
      {modal?.type === "lesson" && <PrivateLessonModal onClose={close} />}
    </>
  );
}
