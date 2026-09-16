"use client";

import { m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CONTACT } from "../data/hero";
import { EASE_OUT, pillMotion } from "../lib/motion";

const COPIED_MS = 2000;
const PILL = "glass-pill inline-flex min-h-11 items-center";
const LABEL = "col-start-1 row-start-1 inline-block";

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
    <m.nav
      aria-label="Contact"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
      className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex flex-wrap justify-end gap-2"
    >
      <m.button
        type="button"
        onClick={handleEmail}
        aria-label={`Copy email address ${contact.email}`}
        className={`${PILL} glass-pill--primary grid`}
        {...pillMotion}
      >
        <m.span
          className={LABEL}
          aria-hidden={copied}
          animate={{ opacity: copied ? 0 : 1, y: copied ? -6 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="hidden sm:inline">{contact.email}</span>
          <span className="sm:hidden">Email</span>
        </m.span>
        <m.span
          className={LABEL}
          aria-hidden={!copied}
          animate={{ opacity: copied ? 1 : 0, y: copied ? 0 : 6 }}
          transition={{ duration: 0.2 }}
        >
          Copied
        </m.span>
      </m.button>
      {contact.links.map((link) => (
        <m.a
          key={link.label}
          href={link.href}
          aria-label={link.ariaLabel}
          target="_blank"
          rel="noopener noreferrer"
          className={PILL}
          {...pillMotion}
        >
          {link.label}
        </m.a>
      ))}
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
    </m.nav>
  );
}
