"use client";

import { m, useScroll, useTransform } from "framer-motion";

/**
 * A small bobbing "scroll" hint at the bottom of the intro viewport, fading
 * out as soon as the story starts. Hidden on mobile, where the intro card
 * sits at the bottom of the screen and would overlap it.
 */
export default function ScrollCue() {
  const { scrollYProgress } = useScroll();
  // A functional mapping (rather than an array range) forces JS evaluation
  // instead of Framer's native WAAPI scroll-timeline fast path, which was
  // observed to extrapolate past the [0, 0.03] window instead of holding at 0.
  const opacity = useTransform(scrollYProgress, (v) =>
    v >= 0.03 ? 0 : 1 - v / 0.03,
  );

  return (
    <m.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 hidden flex-col items-center gap-2 md:flex"
    >
      <span className="text-xs uppercase tracking-[0.3em] text-white/70">
        Scroll
      </span>
      <m.svg
        width="16"
        height="10"
        viewBox="0 0 16 10"
        fill="none"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M1 1L8 8L15 1"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </m.svg>
    </m.div>
  );
}
