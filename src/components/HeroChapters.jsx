"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "../data/hero";
import { SCROLL_LERP } from "../data/heroSequence";
import { chapterVisibility, sectionProgress } from "../lib/sequence";
import GlassPanel from "./GlassPanel";
import { TechCarousel } from "./TechCarousel";

/** How close the eased progress must get to the target before we stop nudging it. */
const PROGRESS_EPS = 0.0005;
/** Max translateY (px) a card starts offset by before it settles into place. */
const RISE_PX = 32;

const SIDE_CLASS = {
  left:
    "pointer-events-none absolute inset-x-4 top-6 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:inset-y-10 md:left-6 md:items-center md:justify-start lg:left-16",
  right:
    "pointer-events-none absolute inset-x-4 top-6 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:inset-y-10 md:right-6 md:items-center md:justify-end lg:right-16",
  // Anchored to the top instead of centered, and pushed down far enough to
  // clear the fixed ContactBar (top-right, ~44px tall) at every width.
  "top-right":
    "pointer-events-none absolute inset-x-4 top-20 z-10 flex items-start justify-center " +
    "md:inset-x-auto md:right-6 md:top-24 md:bottom-auto md:items-start md:justify-end lg:right-16",
  // Bottom strip on phones (clear of the centred character); a column in the
  // empty left 0–30% of frames 008–061 on desktop.
  stack:
    "pointer-events-none absolute inset-x-4 bottom-6 z-10 flex items-end justify-center " +
    "md:inset-x-auto md:top-24 md:bottom-10 md:left-6 md:items-center md:justify-start lg:left-16",
};

const PANEL_CLASS = {
  default:
    "pointer-events-auto max-h-[70vh] w-[min(92vw,30rem)] overflow-y-auto px-6 py-7 sm:px-8 sm:py-9",
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
  const cardRefs = useRef([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shown, setShown] = useState(() => CHAPTERS.map(() => false));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
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
      vis: new Array(CHAPTERS.length).fill(-1),
      shown: new Array(CHAPTERS.length).fill(false),
    };

    const updateTarget = () => {
      const top = section.getBoundingClientRect().top;
      state.target = sectionProgress(
        top,
        section.offsetHeight,
        window.innerHeight,
      );
    };

    const paint = (progress) => {
      CHAPTERS.forEach((chapter, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const v = chapterVisibility(progress, chapter.range);
        if (Math.abs(v - state.vis[i]) < 0.002) return;
        state.vis[i] = v;
        const shown = v > 0.01;
        el.style.opacity = String(v);
        el.style.pointerEvents = shown ? "auto" : "none";
        if (shown) el.removeAttribute("inert");
        else el.setAttribute("inert", "");
        if (state.shown[i] !== shown) {
          state.shown[i] = shown;
          setShown((prev) => prev.map((s, j) => (j === i ? shown : s)));
        }
        if (!reducedMotion) {
          const translate = (1 - v) * RISE_PX;
          const scale = 0.98 + v * 0.02;
          el.style.transform = `translateY(${translate}px) scale(${scale})`;
        }
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
  }, [reducedMotion]);

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
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {CHAPTERS.map((chapter, i) => (
          <div
            key={chapter.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={SIDE_CLASS[chapter.side]}
            style={{ opacity: 0, willChange: "opacity, transform" }}
          >
            <GlassPanel
              tint={chapter.id !== "intro"}
              className={PANEL_CLASS[chapter.id] ?? PANEL_CLASS.default}
            >
              <ChapterContent
                chapter={chapter}
                active={shown[i]}
                onExplore={handleExplore}
              />
            </GlassPanel>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{ chapter: object, active: boolean, onExplore: (p: number) => void }} props
 */
function ChapterContent({ chapter, active, onExplore }) {
  switch (chapter.id) {
    case "intro":
      return <IntroContent chapter={chapter} onExplore={onExplore} />;
    case "about":
      return <AboutContent chapter={chapter} />;
    case "stack":
      return <TechCarousel chapter={chapter} active={active} />;
    case "now":
    case "earlier":
      return <JobsContent chapter={chapter} />;
    case "skills":
      return <SkillsContent chapter={chapter} />;
    case "wins":
      return <WinsContent chapter={chapter} />;
    default:
      return null;
  }
}

function Eyebrow({ children }) {
  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-white/60">
      {children}
    </p>
  );
}

function IntroContent({ chapter, onExplore }) {
  return (
    <>
      <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
        {chapter.name}
      </h1>
      <p className="mt-3 text-lg font-light text-white/80 sm:text-2xl">
        {chapter.role}
      </p>
      <p className="mt-3 text-sm text-white/75">
        {chapter.availability} {chapter.location}.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={chapter.ctaPrimary.href}
          className="glass-pill glass-pill--primary"
        >
          {chapter.ctaPrimary.label}
        </a>
        <button
          type="button"
          className="glass-pill"
          onClick={() => onExplore(chapter.ctaSecondary.target)}
        >
          {chapter.ctaSecondary.label}
        </button>
      </div>
    </>
  );
}

function AboutContent({ chapter }) {
  return (
    <>
      <Eyebrow>{chapter.eyebrow}</Eyebrow>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {chapter.title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
        {chapter.summary}
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {chapter.stats.map((s) => (
          <li key={s} className="glass-chip">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-sm font-medium text-white">
          {chapter.education.degree}
        </p>
        <p className="text-sm text-white/60">
          {chapter.education.school} · {chapter.education.period}
        </p>
      </div>
    </>
  );
}

function JobsContent({ chapter }) {
  return (
    <>
      <Eyebrow>{chapter.eyebrow}</Eyebrow>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {chapter.title}
      </h2>
      <div className="mt-5 space-y-6">
        {chapter.jobs.map((job) => (
          <div key={`${job.company}-${job.role}`}>
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
          </div>
        ))}
      </div>
    </>
  );
}

function SkillsContent({ chapter }) {
  return (
    <>
      <Eyebrow>{chapter.eyebrow}</Eyebrow>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {chapter.title}
      </h2>
      <div className="mt-5 space-y-4">
        {chapter.groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">
              {group.label}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item} className="glass-chip">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
    </>
  );
}

function WinsContent({ chapter }) {
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {chapter.title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
        {chapter.availability}
      </p>
      <a
        href={`mailto:${chapter.email}`}
        className="mt-3 inline-block break-all text-lg font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white sm:text-xl"
      >
        {chapter.email}
      </a>
      <div className="mt-6 flex flex-wrap gap-3">
        {chapter.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            aria-label={link.ariaLabel}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-pill"
          >
            {link.label}
          </a>
        ))}
      </div>
      
    </>
  );
}
