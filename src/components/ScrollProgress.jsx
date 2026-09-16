"use client";

import { m, useScroll, useSpring } from "framer-motion";

/**
 * Thin progress bar across the top of the viewport tracking how far through
 * the page the visitor has scrolled. The hero is the page's only section,
 * so page scroll progress is the same as the hero's story progress.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <m.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-30 h-0.5 origin-left"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, rgba(235,221,194,0.9), rgba(198,177,139,0.9))",
      }}
    />
  );
}
