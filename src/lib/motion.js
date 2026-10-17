/**
 * Shared Framer Motion variants and transitions for the hero. Subtle,
 * premium intensity: short distances, soft springs, quick staggers.
 */

/** Exponential ease-out, per the design craft floor. */
export const EASE_OUT = [0.22, 1, 0.36, 1];

/** Wraps a group of `revealItem` children; staggers them in on activation. */
export const revealContainer = {
  hidden: { transition: { staggerChildren: 0, duration: 0.15 } },
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

/** A single reveal child: rises, sharpens and fades in. */
export const revealItem = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

/** For chip/tag lists inside a `revealContainer`. */
export const chipItem = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 30 },
  },
};

/** A single word sliding up out of its own overflow-hidden mask. */
export const wordItem = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.7, ease: EASE_OUT } },
};

/** Hover/press feedback for glass pills and chips; spread onto `m.a`/`m.button`. */
export const pillMotion = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 30 },
};

/**
 * Reduced-motion counterparts, opacity-only with no stagger.
 *
 * `MotionConfig reducedMotion="user"` reliably reduces a simple inline
 * `initial`/`animate` object (see `ContactBar`'s entrance), but was found
 * (via manual browser testing) to leave content stuck at its `hidden`
 * variant — opacity included, not just transform — when the same value
 * comes from a `variants` chain toggled by external state (`animate={active
 * ? "show" : "hidden"}`), as every chapter's content reveal does. Rather
 * than depend on that global auto-reduction for this pattern, components
 * pick these explicitly when the caller's own `prefers-reduced-motion`
 * flag is set.
 */
export const revealContainerReduced = {
  hidden: { transition: { staggerChildren: 0 } },
  show: { transition: { staggerChildren: 0 } },
};

// `y`/`scale`/`filter` are pinned to their resting value in both states
// (not just "show"), even though this variant never animates them: the
// component tree mounts once with `reducedMotion` still `false` (the flag
// flips true a tick later, once the `matchMedia` effect runs), so the
// *unreduced* variant briefly applies its own `y`/`filter` offset first.
// Framer only ever writes properties a variant target mentions, so once
// the reduced variant takes over, it has to name these explicitly or that
// leftover offset is never cleared.
export const revealItemReduced = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3 },
  },
};

export const chipItemReduced = {
  hidden: { opacity: 0, scale: 1 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export const wordItemReduced = {
  hidden: { y: "0%" },
  show: { y: "0%" },
};

/**
 * Hero chapter cards: scroll only decides whether a card is shown; these
 * play the reveal over time. Used as inline `animate` objects (not variants)
 * so reduced motion applies reliably. No `filter`: a filter on the wrapper
 * would turn it into a backdrop root and flatten the glass panel inside.
 */
const CARD_SPRING = { type: "spring", stiffness: 170, damping: 24, mass: 0.9 };
/** How far (px) a card travels in from its edge, and back out on exit. */
const SLIDE_PX = 40;

/**
 * A card slides in from the side it is anchored to on desktop and rises on
 * phones, where every card shares the bottom slot. It leaves the way it
 * came, quicker. The small entry `delay` lets a card that is leaving clear
 * the shared slot first.
 * @param {'left'|'right'|'top-right'|'stack'} side
 * @param {boolean} desktop
 */
export function chapterReveal(side, desktop) {
  const dir = side === "right" || side === "top-right" ? 1 : -1;
  const offset = desktop ? { x: dir * SLIDE_PX, y: 0 } : { x: 0, y: SLIDE_PX };
  return {
    shown: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        ...CARD_SPRING,
        delay: 0.12,
        opacity: { duration: 0.4, ease: EASE_OUT, delay: 0.12 },
      },
    },
    hidden: {
      opacity: 0,
      ...offset,
      scale: 0.97,
      transition: { duration: 0.25, ease: EASE_OUT },
    },
  };
}

/** Opacity-only counterpart; `x`/`y`/`scale` are pinned so no offset lingers. */
export const chapterRevealReduced = {
  shown: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0.2 } },
  hidden: { opacity: 0, x: 0, y: 0, scale: 1, transition: { duration: 0.2 } },
};

/**
 * Staggered reveal of the content inside a chapter card: the container
 * waits for the card to start landing, then its `revealItem` children rise
 * in one after another; on exit they clear in reverse, fast.
 */
export const contentContainer = {
  hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
};

/** A list of chips: carries only the stagger, so each `chipItem` pops in turn. */
export const chipList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const contentContainerReduced = {
  hidden: { transition: { staggerChildren: 0 } },
  show: { transition: { staggerChildren: 0 } },
};
export const chipListReduced = { hidden: {}, show: {} };

/** Variant sets for chapter content, picked by the caller's `reducedMotion`. */
export const contentMotion = {
  full: {
    container: contentContainer,
    item: revealItem,
    chip: chipItem,
    chipList,
    word: wordItem,
  },
  reduced: {
    container: contentContainerReduced,
    item: revealItemReduced,
    chip: chipItemReduced,
    chipList: chipListReduced,
    word: wordItemReduced,
  },
};
