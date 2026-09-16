"use client";

import { useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const LOOP_SECONDS = 40;
const DESKTOP_QUERY = "(min-width: 768px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

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
 * panel. Horizontal strip on phones, vertical column on desktop. The list is
 * rendered twice and the track slides by exactly half its length, so the
 * loop point is seamless. It only runs while its chapter is on screen and
 * not paused (button) or hovered; reduced motion gets a static layout.
 * @param {{
 *   chapter: { title: string, pauseLabel: string, playLabel: string, items: { id: string, name: string, path: string }[] },
 *   active?: boolean,
 * }} props
 * @param {boolean} [props.active] whether the chapter is currently visible
 */
export function TechCarousel({ chapter, active = false }) {
  const [scope, animate] = useAnimate();
  const controls = useRef(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useMediaQuery(REDUCED_QUERY);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const animated = reducedMotion === false && desktop !== null;

  useEffect(() => {
    const track = scope.current;
    if (!animated || !track) return undefined;
    const keyframes = desktop
      ? { x: 0, y: ["0%", "-50%"] }
      : { x: ["0%", "-50%"], y: 0 };
    controls.current = animate(track, keyframes, {
      duration: LOOP_SECONDS,
      ease: "linear",
      repeat: Infinity,
    });
    controls.current.pause();
    return () => {
      controls.current?.stop();
      controls.current = null;
      track.style.transform = "";
    };
  }, [animated, desktop, animate, scope]);

  const running = animated && active && !paused && !hovered;
  useEffect(() => {
    if (running) controls.current?.play();
    else controls.current?.pause();
  }, [running, animated, desktop]);

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
        <div
          className={`overflow-hidden md:min-h-0 md:flex-1 ${LOOP_MASK}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div ref={scope} className="flex w-max md:w-full md:flex-col">
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
          </div>
        </div>
      )}
    </div>
  );
}
