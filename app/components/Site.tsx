"use client";

import { useBooking } from "./BookingProvider";
import Hero from "./Hero";
import HomeImages from "./HomeImages";
import BookingPaths from "./BookingPaths";
import ClassesTeaser from "./ClassesTeaser";
import StudentOfWeek from "./StudentOfWeek";
import Testimonials from "./Testimonials";
import LocationContact from "./LocationContact";

// Home page. Party packages + private-lesson detail now live on /parties and
// /classes; the home is a focal-point hero + teasers + community sections.
export default function Site() {
  const { openLesson } = useBooking();

  return (
    <main>
      <Hero onBookLesson={openLesson} />
      <HomeImages />
      <BookingPaths onBookLesson={openLesson} />
      <ClassesTeaser />
      <StudentOfWeek />
      <Testimonials />
      <LocationContact />
    </main>
  );
}
