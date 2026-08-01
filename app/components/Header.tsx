"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, SITE } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="header-logo-link" aria-label="Free Flow Fitness home">
          {/* black FF mark, inverted to read on the dark bar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="header-logo" src="/logos/ff-black-mark.png" alt="Free Flow Fitness" />
        </Link>

        <nav className="nav" aria-label="Primary">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={isActive(n.href) ? "active" : ""}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <a className="btn btn-signup" href={SITE.signupUrl}>
            First Time? Sign Up Here!!!
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobile-menu" aria-label="Mobile">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={isActive(n.href) ? "active" : ""}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                className="btn btn-signup mobile-signup"
                href={SITE.signupUrl}
                onClick={() => setOpen(false)}
              >
                First Time? Sign Up Here!!!
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
