"use client";

import { useEffect, useRef, useState } from "react";
import { useImageSequence } from "../hooks/useImageSequence";
import {
  coverRect,
  nearestLoaded,
  pointerToFrame,
  scrollToFrame,
  sectionProgress,
} from "../lib/sequence";
import {
  CENTER_INDEX,
  DEAD_ZONE,
  FRAME_COUNT,
  LERP,
  POSTER,
  PRELOAD_CONCURRENCY,
  SCROLL_LERP,
  SCROLL_START,
  TRANSFORM_COUNT,
  frameSrc,
  transformSrc,
} from "../data/heroSequence";

const MAX_DPR = 2;
/** Draw-key namespaces so a mouse frame and a transform frame never collide. */
const KEY_MOUSE = 0;
const KEY_SCROLL = 10_000;
const KEY_POSTER = -2;
/** How close (in frames) a sequence must be to its rest pose before handing off. */
const HANDOFF_EPS = 0.5;

/**
 * Full-viewport sticky canvas behind the hero, driven by two image sequences
 * that share the same rest pose:
 *
 * - 0–10 % scroll: the 91-frame left-right sequence scrubs with mouse X
 *   (frame 051 at rest; left → 001, right → 091).
 * - 10–100 % scroll: the 151-frame transform sequence scrubs with scroll
 *   progress (frame 001 at 10 %, frame 151 at 100 %).
 *
 * Both are position-based (never time-based), lerped, DPR-aware, and only
 * repaint when the visible frame actually changes. Reduced-motion users get
 * no mouse tracking and scroll maps directly to a frame with no easing.
 */
export default function HeroSequenceCanvas() {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const mouseSeq = useImageSequence({
    count: FRAME_COUNT,
    center: CENTER_INDEX,
    src: frameSrc,
    concurrency: PRELOAD_CONCURRENCY,
  });
  const scrollSeq = useImageSequence({
    count: TRANSFORM_COUNT,
    center: 0,
    src: transformSrc,
    concurrency: PRELOAD_CONCURRENCY,
  });
  const mouseImages = mouseSeq.images;
  const scrollImages = scrollSeq.images;

  // Detect prefers-reduced-motion once on the client.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return undefined;
    const section = wrapper.parentElement;

    // --- mutable loop state, all hoisted so nothing allocates per frame ---
    const state = {
      progress: 0, // 0–1 through the section
      mouseTarget: CENTER_INDEX,
      mouseCurrent: CENTER_INDEX,
      scrollTarget: 0,
      scrollCurrent: 0,
      scrollActive: false, // progress >= SCROLL_START
      drawnKey: -1,
      cssW: 0,
      cssH: 0,
      dpr: 1,
      dirty: true,
      raf: 0,
      poster: /** @type {HTMLImageElement|null} */ (null),
      coarse: window.matchMedia("(pointer: coarse)").matches,
    };
    const rect = { x: 0, y: 0, w: 0, h: 0 };

    const draw = (img, key) => {
      if (key === state.drawnKey) return;
      coverRect(
        img.naturalWidth,
        img.naturalHeight,
        state.cssW,
        state.cssH,
        rect,
      );
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      state.drawnKey = key;
    };

    const updateProgress = () => {
      if (!section) return;
      const top = section.getBoundingClientRect().top;
      state.progress = sectionProgress(top, section.offsetHeight, state.cssH);
      const t = scrollToFrame(state.progress, {
        count: TRANSFORM_COUNT,
        start: SCROLL_START,
      });
      state.scrollActive = t !== -1;
      state.scrollTarget = state.scrollActive ? t : 0;
      if (state.scrollActive) state.mouseTarget = CENTER_INDEX;
      state.dirty = true;
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = wrapper;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      if (w === state.cssW && h === state.cssH && dpr === state.dpr) return;
      state.cssW = w;
      state.cssH = h;
      state.dpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      state.drawnKey = -1; // force redraw at the new size
      updateProgress();
    };

    /** Move `current` toward `target`; returns true if it changed. */
    const approach = (cur, target, lerp) => {
      const delta = target - cur;
      if (Math.abs(delta) > 0.01) return cur + delta * lerp;
      return target;
    };

    /**
     * Paint the frame for the current state. The transform sequence owns the
     * screen once scroll is past the threshold *and* the mouse sequence has
     * eased back to its rest pose (the two share that pose, so the swap is
     * invisible). Scrolling back up reverses the handoff the same way.
     */
    const paint = () => {
      const mouseAtRest =
        Math.abs(state.mouseCurrent - CENTER_INDEX) <= HANDOFF_EPS;
      const scrollAtRest = state.scrollCurrent <= HANDOFF_EPS;
      const useScroll = state.scrollActive ? mouseAtRest : !scrollAtRest;

      if (useScroll) {
        const idx = nearestLoaded(scrollImages.current, state.scrollCurrent);
        if (idx !== -1)
          return draw(scrollImages.current[idx], KEY_SCROLL + idx);
      }
      const idx = nearestLoaded(mouseImages.current, state.mouseCurrent);
      if (idx !== -1) return draw(mouseImages.current[idx], KEY_MOUSE + idx);
      if (state.poster) draw(state.poster, KEY_POSTER);
      return undefined;
    };

    const tick = () => {
      state.raf = requestAnimationFrame(tick);

      const m = approach(state.mouseCurrent, state.mouseTarget, LERP);
      const s = approach(state.scrollCurrent, state.scrollTarget, SCROLL_LERP);
      if (m !== state.mouseCurrent || s !== state.scrollCurrent) {
        state.mouseCurrent = m;
        state.scrollCurrent = s;
        state.dirty = true;
      }
      if (!state.dirty) return;
      paint();
      // Stay dirty while nothing is decoded yet so the poster / first frame
      // lands as soon as it arrives.
      state.dirty = state.drawnKey === -1;
    };

    const onPointerMove = (e) => {
      if (state.coarse || state.scrollActive) return;
      state.mouseTarget = pointerToFrame(e.clientX, window.innerWidth, {
        count: FRAME_COUNT,
        center: CENTER_INDEX,
        deadZone: DEAD_ZONE,
      });
    };
    const onLeave = () => {
      state.mouseTarget = CENTER_INDEX;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    // Poster: paint immediately so there is never a blank canvas.
    const poster = new Image();
    poster.src = POSTER;
    poster
      .decode()
      .catch(() => {})
      .finally(() => {
        if (poster.naturalWidth) {
          state.poster = poster;
          state.dirty = true;
        }
      });

    if (reducedMotion) {
      // No mouse tracking, no easing: scroll position maps straight to a frame.
      const onScrollStatic = () => {
        updateProgress();
        state.scrollCurrent = state.scrollTarget;
        state.mouseCurrent = CENTER_INDEX;
      };
      const staticTick = () => {
        state.raf = requestAnimationFrame(staticTick);
        if (!state.dirty) return;
        paint();
        state.dirty = state.drawnKey === -1;
      };
      window.addEventListener("scroll", onScrollStatic, { passive: true });
      onScrollStatic();
      state.raf = requestAnimationFrame(staticTick);
      return () => {
        cancelAnimationFrame(state.raf);
        ro.disconnect();
        window.removeEventListener("scroll", onScrollStatic);
      };
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("blur", onLeave);
    document.documentElement.addEventListener("pointerleave", onLeave);
    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [mouseImages, scrollImages, reducedMotion]);

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none sticky top-0 z-0 h-screen w-full overflow-hidden bg-black"
      aria-hidden="true"
      data-ready={mouseSeq.ready ? "true" : "false"}
      data-transform-ready={scrollSeq.ready ? "true" : "false"}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
