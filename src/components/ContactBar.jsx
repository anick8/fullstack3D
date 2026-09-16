"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT } from "../data/hero";

const COPIED_MS = 2000;
const PILL = "glass-pill inline-flex min-h-11 items-center";

/**
 * Always-visible contact bar pinned to the top-right of the viewport.
 * The email button copies the address, falling back to mailto when the
 * clipboard is unavailable.
 * @param {{ contact?: typeof CONTACT }} props
 */
export function ContactBar({ contact = CONTACT }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  return (
    <nav
      aria-label="Contact"
      className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex flex-wrap justify-end gap-2"
    >
      <button
        type="button"
        onClick={handleEmail}
        aria-label={`Copy email address ${contact.email}`}
        className={`${PILL} glass-pill--primary`}
      >
        {copied ? (
          "Copied"
        ) : (
          <>
            <span className="hidden sm:inline">{contact.email}</span>
            <span className="sm:hidden">Email</span>
          </>
        )}
      </button>
      {contact.links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.ariaLabel}
          target="_blank"
          rel="noopener noreferrer"
          className={PILL}
        >
          {link.label}
        </a>
      ))}
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
    </nav>
  );
}
