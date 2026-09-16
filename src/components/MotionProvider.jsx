"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/**
 * Loads the small `domAnimation` feature bundle (~20KB) and applies
 * `reducedMotion="user"` globally, so transform-based motion is disabled
 * for anyone with `prefers-reduced-motion: reduce` while opacity fades
 * still play.
 * @param {{ children: React.ReactNode }} props
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
