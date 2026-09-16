/**
 * Config for the mouse-driven hero image sequence.
 * Frames are 1-indexed on disk (001.webp … 091.webp); indices here are 0-based.
 */
export const FRAME_COUNT = 91;
export const CENTER_INDEX = 50; // frame 051 — the rest pose
export const FRAME_DIR = '/frames/lr2';
export const POSTER = '/firstframe.png';

/** Fraction of the distance to the target frame closed each rAF tick. */
export const LERP = 0.12;
/** Half-width of the neutral zone around the viewport centre (0–0.5). */
export const DEAD_ZONE = 0.04;
/** Max simultaneous image loads. */
export const PRELOAD_CONCURRENCY = 6;

/**
 * @param {number} index 0-based frame index
 * @returns {string} public URL of the frame
 */
export function frameSrc(index) {
  return `${FRAME_DIR}/${String(index + 1).padStart(3, '0')}.webp`;
}

/**
 * Scroll-driven "transform" sequence (001.webp … 151.webp). Frame 001 is the
 * same rest pose as left-right 051, so the two sequences hand off seamlessly.
 */
export const TRANSFORM_COUNT = 151;
export const TRANSFORM_DIR = '/frames/transform';
/** Scroll progress (0–1) through the hero section before the transform starts. */
export const SCROLL_START = 0.1;
/** Lerp factor for scroll scrubbing — a touch snappier than the mouse. */
export const SCROLL_LERP = 0.16;

/**
 * @param {number} index 0-based frame index
 * @returns {string} public URL of the transform frame
 */
export function transformSrc(index) {
  return `${TRANSFORM_DIR}/${String(index + 1).padStart(3, '0')}.webp`;
}
