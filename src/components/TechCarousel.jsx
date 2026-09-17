"use client";

import {
  animate,
  m,
  useAnimationFrame,
  useMotionValue,
  useTransform,
  wrap,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

const LOOP_SECONDS = 40;
const DESKTOP_QUERY = "(min-width: 768px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
/** Pointer travel (px) before a press counts as a drag, so taps stay taps. */
const DRAG_THRESHOLD = 4;
/** Distance (px) one arrow-key press scrolls. */
const KEY_STEP = 120;
/** Momentum decay time constant (s): how long a flick keeps coasting. */
const GLIDE_TAU = 0.4;
/** Decay constants the glide runs for; 4 leaves ~2% of the throw at the end. */
const GLIDE_SPANS = 4;
const GLIDE_NORM = 1 - Math.exp(-GLIDE_SPANS);
/** Exponential decay as a 0–1 easing, the curve an inertial scroll follows. */
const glideEase = (p) => (1 - Math.exp(-GLIDE_SPANS * p)) / GLIDE_NORM;
const KEY_SPRING = { type: "spring", stiffness: 300, damping: 35 };
/** Only pointer samples this recent (ms) count toward the release velocity. */
const VELOCITY_WINDOW_MS = 100;

/**
 * Release velocity (px/s) from recent pointer samples. Returns 0 when the
 * pointer had come to rest, so a slow, deliberate drop doesn’t fling.
 * @param {{ t: number, v: number }[]} samples oldest first
 * @param {number} now event timestamp of the release
 * @returns {number}
 */
export function releaseVelocity(samples, now) {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = last.t - first.t;
  return dt > 0 ? ((last.v - first.v) / dt) * 1000 : 0;
}

// Icon over label on phones (horizontal strip), icon beside label on desktop
// (vertical column). No per-tile backdrop blur: the panel's own blur does
// the glass, so moving tiles never force a backdrop re-sample.
const TILE =
  "glass-tile flex w-20 shrink-0 flex-col items-center gap-1.5 px-2 py-3 text-[11px] leading-tight " +
  "md:w-full md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm";
const LOOP_MASK =
  "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] " +
  "md:[mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]";

/**
 * Subscribes to a media query; `null` until mounted so server and first
 * client render agree.
 * @param {string} query
 * @returns {boolean|null}
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** @param {{ item: { name: string, path: string } }} props */
function TechTile({ item }) {
  return (
    <li className={TILE}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <path d={item.path} />
      </svg>
      <span className="text-center md:text-left">{item.name}</span>
    </li>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
    </svg>
  );
}

/**
 * The "stack" hero chapter: an endless loop of tech logos inside a glass
 * panel. Horizontal strip on phones, vertical column on desktop.
 *
 * One `offset` motion value drives everything: autoplay drifts it, drag and
 * swipe set it directly, release coasts on with an exponential decay that
 * starts at the pointer's speed, and arrow keys spring it by a step. The list is rendered twice
 * and `offset` is wrapped to one copy's length, so any offset is seamless.
 * Autoplay only runs while the chapter is on screen and not paused, hovered
 * or being interacted with; reduced motion gets a static layout.
 * @param {{
 *   chapter: { title: string, pauseLabel: string, playLabel: string, scrollLabel: string, items: { id: string, name: string, path: string }[] },
 *   active?: boolean,
 * }} props
 * @param {boolean} [props.active] whether the chapter is currently visible
 */
export function TechCarousel({ chapter, active = false }) {
  const trackRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [loopLength, setLoopLength] = useState(0);
  const reducedMotion = useMediaQuery(REDUCED_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const animated = reducedMotion === false && desktop !== null;

  const offset = useMotionValue(0);
  const wrapped = useTransform(offset, (v) =>
    loopLength ? wrap(-loopLength, 0, v) : 0,
  );
  // Pointer bookkeeping plus the in-flight glide; refs, not state, so a drag
  // never re-renders.
  const gesture = useRef({
    id: null,
    start: 0,
    origin: 0,
    dragging: false,
    samples: [],
  });
  const glide = useRef(null);

  useEffect(() => {
    const copy = trackRef.current?.firstElementChild;
    if (!animated || !copy) return undefined;
    const measure = () =>
      setLoopLength(desktop ? copy.offsetHeight : copy.offsetWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [animated, desktop]);

  // Switching axis starts the loop fresh on the new one.
  useEffect(() => {
    glide.current?.stop();
    offset.set(0);
  }, [desktop, offset]);

  useEffect(() => () => glide.current?.stop(), []);

  // Framer caps its per-frame delta at 40ms, which would slow the drift on
  // low-fps devices, so step by wall-clock time since the last frame.
  const lastFrame = useRef(null);
  useAnimationFrame((time) => {
    const elapsed = lastFrame.current === null ? 0 : time - lastFrame.current;
    lastFrame.current = time;
    const busy = gesture.current.id !== null || glide.current !== null;
    if (!animated || !active || paused || hovered || busy || !loopLength) {
      return;
    }
    const step = (loopLength / LOOP_SECONDS) * (Math.min(elapsed, 250) / 1000);
    offset.set(offset.get() - step);
  });

  const axisOf = (event) => (desktop ? event.clientY : event.clientX);

  /** @param {number} target @param {object} transition */
  const glideTo = (target, transition) => {
    glide.current?.stop();
    const controls = animate(offset, target, transition);
    glide.current = controls;
    controls.then(() => {
      if (glide.current === controls) glide.current = null;
    });
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    glide.current?.stop();
    glide.current = null;
    gesture.current = {
      id: event.pointerId,
      start: axisOf(event),
      origin: offset.get(),
      dragging: false,
      samples: [],
    };
  };

  const handlePointerMove = (event) => {
    const g = gesture.current;
    if (g.id !== event.pointerId) return;
    const travel = axisOf(event) - g.start;
    if (!g.dragging) {
      if (Math.abs(travel) < DRAG_THRESHOLD) return;
      g.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setGrabbing(true);
    }
    const next = g.origin + travel;
    offset.set(next);
    g.samples.push({ t: event.timeStamp, v: next });
    if (g.samples.length > 8) g.samples.shift();
  };

  const handlePointerEnd = (event) => {
    const g = gesture.current;
    if (g.id !== event.pointerId) return;
    gesture.current = { ...g, id: null, dragging: false, samples: [] };
    if (!g.dragging) return;
    setGrabbing(false);
    const velocity = releaseVelocity(g.samples, event.timeStamp);
    if (velocity === 0) return;
    // Throw distance chosen so the decay starts at exactly the release speed.
    const throwDistance = (velocity * GLIDE_TAU) / GLIDE_NORM;
    glideTo(offset.get() + throwDistance, {
      duration: GLIDE_TAU * GLIDE_SPANS,
      ease: glideEase,
    });
  };

  const handleKeyDown = (event) => {
    const back = desktop ? "ArrowUp" : "ArrowLeft";
    const forward = desktop ? "ArrowDown" : "ArrowRight";
    if (event.key !== back && event.key !== forward) return;
    event.preventDefault();
    const step = event.key === forward ? -KEY_STEP : KEY_STEP;
    glideTo(offset.get() + step, KEY_SPRING);
  };

  // Trackpad sideways swipes scroll the phone strip. Vertical wheel is left
  // to the page, which drives the whole hero.
  const handleWheel = (event) => {
    if (desktop || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    glide.current?.stop();
    glide.current = null;
    offset.set(offset.get() - event.deltaX);
  };

  const { items } = chapter;

  return (
    <div className="flex flex-col gap-3 md:h-full md:gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
          {chapter.title}
        </h2>
        {animated && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? chapter.playLabel : chapter.pauseLabel}
            className="glass-pill grid h-11 w-11 shrink-0 place-items-center p-0"
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </button>
        )}
      </div>

      {reducedMotion ? (
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:[&>li]:w-full md:[&>li]:flex-col md:[&>li]:px-2 md:[&>li]:text-[11px]">
          {items.map((tech) => (
            <TechTile key={tech.id} item={tech} />
          ))}
        </ul>
      ) : (
        // The focus ring lives on this wrapper so the edge mask can't fade it.
        <div
          role="region"
          aria-label={chapter.scrollLabel}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/85 md:flex md:min-h-0 md:flex-1 md:flex-col"
        >
          <div
            className={`select-none overflow-hidden touch-pan-y md:min-h-0 md:flex-1 md:touch-pan-x ${LOOP_MASK} ${
              grabbing ? "cursor-grabbing" : "cursor-grab"
            }`}
            onPointerEnter={(e) =>
              e.pointerType === "mouse" && setHovered(true)
            }
            onPointerLeave={(e) =>
              e.pointerType === "mouse" && setHovered(false)
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={handleWheel}
          >
            <m.div
              ref={trackRef}
              className="flex w-max md:w-full md:flex-col"
              style={desktop ? { y: wrapped } : { x: wrapped }}
            >
              {[false, true].map((duplicate) => (
                <ul
                  key={String(duplicate)}
                  aria-hidden={duplicate || undefined}
                  className="flex gap-2 pr-2 md:flex-col md:pb-2 md:pr-0"
                >
                  {items.map((tech) => (
                    <TechTile key={tech.id} item={tech} />
                  ))}
                </ul>
              ))}
            </m.div>
          </div>
        </div>
      )}
    </div>
  );
}
