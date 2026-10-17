"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHAPTERS } from "../data/hero";
import { SCROLL_LERP } from "../data/heroSequence";
import { m, motionValue } from "framer-motion";
import {
  chapterReveal,
  chapterRevealReduced,
  contentMotion,
  pillMotion,
} from "../lib/motion";
import {
  chapterActive,
  chapterHold,
  chapterRange,
  sectionProgress,
} from "../lib/sequence";
import GlassPanel from "./GlassPanel";
import { TechCarousel } from "./TechCarousel";

/** How close the eased progress must get to the target before we stop nudging it. */
const PROGRESS_EPS = 0.0005;
/** A held card drifts from +DRIFT_PX to -DRIFT_PX as you scroll through it. */
const DRIFT_PX = 14;
/** Matches Tailwind's `md` breakpoint. */
const DESKTOP_QUERY = "(min-width: 768px)";

const SIDE_CLASS = {
  left:
    "pointer-events-none absolute inset-x-4 top-6 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:inset-y-10 md:left-6 md:items-center md:justify-start lg:left-16",
  right:
    "pointer-events-none absolute inset-x-4 top-6 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:inset-y-10 md:right-6 md:items-center md:justify-end lg:right-16",
  // Bottom-anchored on phones (it takes the intro's place once that fades);
  // from md up it sits top-right, pushed down far enough to clear the fixed
  // ContactBar (~44px tall).
  "top-right":
    "pointer-events-none absolute inset-x-4 top-6 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:right-6 md:top-24 md:bottom-auto md:items-start md:justify-end lg:right-16",
  // Bottom strip on phones (clear of the centred character); a column in the
  // empty left 0–30% of frames 008–061 on desktop.
  stack:
    "pointer-events-none absolute inset-x-4 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:top-24 md:bottom-10 md:left-6 md:items-center md:justify-start lg:left-16",
};

const PANEL_CLASS = {
  default:
    "pointer-events-auto max-h-[calc(100svh-7rem)] w-[min(92vw,30rem)] overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-9 md:max-h-[70vh]",
  stack:
    "pointer-events-auto w-[min(92vw,30rem)] p-4 md:h-full md:max-h-[40rem] md:w-60 md:p-5 lg:w-64",
};

/**
 * Seven glass "chapters" of resume content that fade in/out over the hero's
 * scroll runway, synced to the same section-progress and lerp the canvas
 * uses. Positioned in the empty space of each transform frame (see
 * docs/hero-scroll-map.md).
 */
export default function HeroChapters() {
  const outerRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [shown, setShown] = useState(() => CHAPTERS.map(() => false));
  // One motion value per card: scroll writes it, the card reads it as `y`.
  // No React state, so a held card drifts without re-rendering.
  const drifts = useMemo(() => CHAPTERS.map(() => motionValue(0)), []);
  // Mirrors `shown` for the paint loop. A ref (not per-effect state) so it
  // survives the effect re-running when `desktop` or `reducedMotion` flips,
  // which would otherwise leave a card stuck on from the first render.
  const shownRef = useRef(CHAPTERS.map(() => false));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const section = outer?.parentElement;
    if (!outer || !section) return undefined;

    const state = {
      target: 0,
      current: 0,
      applied: null, // last progress the cards were painted at
      raf: 0,
    };

    const updateTarget = () => {
      const top = section.getBoundingClientRect().top;
      state.target = sectionProgress(
        top,
        section.offsetHeight,
        window.innerHeight,
      );
    };

    // Scroll only flips a card on or off; the reveal itself is a timed
    // animation (see `chapterReveal`), so no card is ever left half-shown.
    // A showing card also drifts gently with scroll, so it never feels pinned.
    const paint = (progress) => {
      CHAPTERS.forEach((chapter, i) => {
        const range = chapterRange(chapter, desktop);
        const shown = chapterActive(progress, range);
        if (shown && !reducedMotion) {
          drifts[i].set((0.5 - chapterHold(progress, range)) * 2 * DRIFT_PX);
        }
        if (shownRef.current[i] === shown) return;
        shownRef.current[i] = shown;
        setShown((prev) => prev.map((s, j) => (j === i ? shown : s)));
      });
    };

    if (reducedMotion) {
      const onScroll = () => {
        updateTarget();
        state.current = state.target;
        paint(state.current);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      onScroll();
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const tick = () => {
      state.raf = requestAnimationFrame(tick);
      const delta = state.target - state.current;
      if (Math.abs(delta) > PROGRESS_EPS) {
        state.current += delta * SCROLL_LERP;
      } else if (state.current !== state.target) {
        state.current = state.target;
      } else if (state.applied === state.current) {
        return; // settled and already painted — nothing to do
      }
      state.applied = state.current;
      paint(state.current);
    };

    const onScroll = () => updateTarget();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateTarget();
    state.current = state.target;
    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion, desktop, drifts]);

  const handleExplore = (targetProgress) => {
    const section = outerRef.current?.parentElement;
    if (!section) return;
    const runway = section.offsetHeight - window.innerHeight;
    const docTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: docTop + runway * targetProgress,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div ref={outerRef} className="pointer-events-none absolute inset-0 z-10">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {CHAPTERS.map((chapter, i) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            shown={shown[i]}
            drift={drifts[i]}
            reducedMotion={reducedMotion}
            desktop={desktop}
          >
            <ChapterContent
              chapter={chapter}
              active={shown[i]}
              reducedMotion={reducedMotion}
              onExplore={handleExplore}
            />
          </ChapterCard>
        ))}
      </div>
    </div>
  );
}

/**
 * One positioned card. The outer wrapper owns the enter/exit spring; the
 * inner one owns the scroll drift, so the two never fight over `y`.
 * @param {{
 *   chapter: object,
 *   shown: boolean,
 *   drift: import("framer-motion").MotionValue<number>,
 *   reducedMotion: boolean,
 *   desktop: boolean,
 *   children: React.ReactNode,
 * }} props
 */
function ChapterCard({ chapter, shown, drift, reducedMotion, desktop, children }) {
  const reveal = useMemo(
    () =>
      reducedMotion
        ? chapterRevealReduced
        : chapterReveal(chapter.side, desktop),
    [reducedMotion, chapter.side, desktop],
  );
  return (
    <m.div
      className={SIDE_CLASS[chapter.side]}
      initial={reveal.hidden}
      animate={shown ? reveal.shown : reveal.hidden}
      inert={shown ? undefined : ""}
    >
      <m.div
        style={{ y: drift }}
        className={chapter.id === "stack" ? "md:h-full" : undefined}
      >
        <GlassPanel
          tint={chapter.id !== "intro"}
          className={PANEL_CLASS[chapter.id] ?? PANEL_CLASS.default}
        >
          {children}
        </GlassPanel>
      </m.div>
    </m.div>
  );
}

/**
 * Staggers a chapter's content in once its card is showing. Every block
 * below takes its variants from `v`, so reduced motion swaps the whole set.
 * @param {{ chapter: object, active: boolean, reducedMotion: boolean, onExplore: (p: number) => void }} props
 */
function ChapterContent({ chapter, active, reducedMotion, onExplore }) {
  const v = reducedMotion ? contentMotion.reduced : contentMotion.full;
  return (
    <m.div
      variants={v.container}
      initial="hidden"
      animate={active ? "show" : "hidden"}
      className={chapter.id === "stack" ? "md:h-full" : undefined}
    >
      <ChapterBody
        chapter={chapter}
        active={active}
        v={v}
        onExplore={onExplore}
      />
    </m.div>
  );
}

function ChapterBody({ chapter, active, v, onExplore }) {
  switch (chapter.id) {
    case "intro":
      return <IntroContent chapter={chapter} v={v} onExplore={onExplore} />;
    case "about":
      return <AboutContent chapter={chapter} v={v} />;
    case "stack":
      return <TechCarousel chapter={chapter} active={active} item={v.item} />;
    case "now":
    case "earlier":
      return <JobsContent chapter={chapter} v={v} />;
    case "skills":
      return <SkillsContent chapter={chapter} v={v} />;
    case "wins":
      return <WinsContent chapter={chapter} v={v} />;
    default:
      return null;
  }
}

const H2 =
  "text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl";
const CHIP_HOVER = { y: -2 };

function Eyebrow({ children, variants }) {
  return (
    <m.p
      variants={variants}
      className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-white/60 sm:mb-4"
    >
      {children}
    </m.p>
  );
}

/**
 * A chip list: the `ul` carries the stagger, each chip pops in on a spring
 * and lifts on hover.
 * @param {{ items: string[], v: object, className: string }} props
 */
function ChipList({ items, v, className }) {
  return (
    <m.ul variants={v.chipList} className={className}>
      {items.map((item) => (
        <m.li
          key={item}
          variants={v.chip}
          whileHover={CHIP_HOVER}
          className="glass-chip"
        >
          {item}
        </m.li>
      ))}
    </m.ul>
  );
}

function IntroContent({ chapter, v, onExplore }) {
  return (
    <>
      <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
        {chapter.name.split(" ").map((word, i) => (
          <span key={`${word}-${i}`}>
            {i > 0 && " "}
            {/* Each word rises out of its own mask. */}
            <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <m.span variants={v.word} className="inline-block">
                {word}
              </m.span>
            </span>
          </span>
        ))}
      </h1>
      <m.p
        variants={v.item}
        className="mt-3 text-lg font-light text-white/80 sm:text-2xl"
      >
        {chapter.role}
      </m.p>
      <m.p variants={v.item} className="mt-3 text-sm text-white/75">
        {chapter.availability} {chapter.location}.
      </m.p>
      <m.div variants={v.item} className="mt-8 flex flex-wrap gap-3">
        <m.a
          href={chapter.ctaPrimary.href}
          className="glass-pill glass-pill--primary"
          {...pillMotion}
        >
          {chapter.ctaPrimary.label}
        </m.a>
        <m.button
          type="button"
          className="glass-pill"
          onClick={() => onExplore(chapter.ctaSecondary.target)}
          {...pillMotion}
        >
          {chapter.ctaSecondary.label}
        </m.button>
      </m.div>
    </>
  );
}

function AboutContent({ chapter, v }) {
  return (
    <>
      <Eyebrow variants={v.item}>{chapter.eyebrow}</Eyebrow>
      <m.h2 variants={v.item} className={H2}>
        {chapter.title}
      </m.h2>
      <m.p
        variants={v.item}
        className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base"
      >
        {chapter.summary}
      </m.p>
      <ChipList
        items={chapter.stats}
        v={v}
        className="mt-4 flex flex-wrap gap-2 sm:mt-6"
      />
      <m.div
        variants={v.item}
        className="mt-4 border-t border-white/10 pt-3 sm:mt-6 sm:pt-4"
      >
        <p className="text-sm font-medium text-white">
          {chapter.education.degree}
        </p>
        <p className="text-sm text-white/60">
          {chapter.education.school} · {chapter.education.period}
        </p>
      </m.div>
    </>
  );
}

function JobsContent({ chapter, v }) {
  return (
    <>
      <Eyebrow variants={v.item}>{chapter.eyebrow}</Eyebrow>
      <m.h2 variants={v.item} className={H2}>
        {chapter.title}
      </m.h2>
      <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-6">
        {chapter.jobs.map((job) => (
          <m.div key={`${job.company}-${job.role}`} variants={v.item}>
            <p className="text-base font-medium text-white sm:text-lg">
              {job.role}
            </p>
            <p className="text-sm text-white/60">
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/40 underline-offset-4 hover:decoration-white"
                >
                  {job.company}
                </a>
              ) : (
                job.company
              )}{" "}
              · {job.period}
            </p>
            <ul className="mt-2 space-y-1.5">
              {job.bullets.map((b) => (
                <li key={b} className="text-sm leading-relaxed text-white/75">
                  {b}
                </li>
              ))}
            </ul>
          </m.div>
        ))}
      </div>
    </>
  );
}

function SkillsContent({ chapter, v }) {
  return (
    <>
      <Eyebrow variants={v.item}>{chapter.eyebrow}</Eyebrow>
      <m.h2 variants={v.item} className={H2}>
        {chapter.title}
      </m.h2>
      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
        {chapter.groups.map((group) => (
          <m.div key={group.label} variants={v.item}>
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">
              {group.label}
            </p>
            <ChipList
              items={group.items}
              v={v}
              className="mt-2 flex flex-wrap gap-2"
            />
          </m.div>
        ))}
      </div>
    </>
  );
}

function WinsContent({ chapter, v }) {
  return (
    <>
      <m.h2 variants={v.item} className={H2}>
        {chapter.title}
      </m.h2>
      <m.p
        variants={v.item}
        className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base"
      >
        {chapter.availability}
      </m.p>
      <m.a
        variants={v.item}
        href={`mailto:${chapter.email}`}
        className="mt-3 inline-block break-all text-lg font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white sm:text-xl"
      >
        {chapter.email}
      </m.a>
      <m.div variants={v.item} className="mt-6 flex flex-wrap gap-3">
        {chapter.links.map((link) => (
          <m.a
            key={link.label}
            href={link.href}
            aria-label={link.ariaLabel}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-pill"
            {...pillMotion}
          >
            {link.label}
          </m.a>
        ))}
      </m.div>
    </>
  );
}
