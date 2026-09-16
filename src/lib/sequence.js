/**
 * Pure helpers for the image-sequence canvas. Kept free of DOM so they are
 * unit-testable in jsdom.
 */

/**
 * Order in which to preload frames: the centre first, then fanning outward
 * (c, c-1, c+1, c-2, c+2 …) so the frames nearest the rest pose arrive first.
 * @param {number} count
 * @param {number} center
 * @returns {number[]}
 */
export function preloadOrder(count, center) {
  const order = [center];
  for (let d = 1; order.length < count; d++) {
    if (center - d >= 0) order.push(center - d);
    if (center + d < count) order.push(center + d);
  }
  return order;
}

/**
 * Nearest index whose slot is truthy (decoded), searching outward from `index`.
 * Returns -1 only if nothing is loaded at all.
 * @param {ArrayLike<unknown>} loaded sparse array — truthy where decoded
 * @param {number} index preferred index
 * @returns {number}
 */
export function nearestLoaded(loaded, index) {
  const n = loaded.length;
  if (n === 0) return -1;
  const i = Math.min(Math.max(Math.round(index), 0), n - 1);
  if (loaded[i]) return i;
  for (let d = 1; d < n; d++) {
    if (i - d >= 0 && loaded[i - d]) return i - d;
    if (i + d < n && loaded[i + d]) return i + d;
  }
  return -1;
}

/**
 * Map a horizontal pointer position to a target frame index.
 * Centre of the viewport (± deadZone) maps to `center`; the edges map to 0
 * and `count - 1`, with a gentle ease so the extremes feel weighted.
 * @param {number} x pointer clientX
 * @param {number} width viewport width
 * @param {{ count: number, center: number, deadZone: number }} opts
 * @returns {number} float frame index in [0, count - 1]
 */
export function pointerToFrame(x, width, { count, center, deadZone }) {
  if (width <= 0) return center;
  let t = x / width - 0.5; // -0.5 … 0.5
  const abs = Math.abs(t);
  if (abs <= deadZone) return center;
  // Re-normalise beyond the dead zone to 0…1 and ease (smoothstep-ish).
  const u = Math.min((abs - deadZone) / (0.5 - deadZone), 1);
  const eased = u * u * (3 - 2 * u);
  const span = t < 0 ? center : count - 1 - center;
  return center + Math.sign(t) * eased * span;
}

/**
 * Compute the destination rect to draw `sw × sh` covering `dw × dh`
 * (like CSS `object-fit: cover`), centred.
 * @param {number} sw
 * @param {number} sh
 * @param {number} dw
 * @param {number} dh
 * @param {{ x: number, y: number, w: number, h: number }} out mutated in place
 */
export function coverRect(sw, sh, dw, dh, out) {
  const scale = Math.max(dw / sw, dh / sh);
  out.w = sw * scale;
  out.h = sh * scale;
  out.x = (dw - out.w) / 2;
  out.y = (dh - out.h) / 2;
  return out;
}

/**
 * Map scroll progress through a section to a target frame index.
 * Progress below `start` returns -1 (sequence inactive); `start`…1 maps
 * linearly onto 0…`count - 1`.
 * @param {number} progress 0–1 scroll progress through the section
 * @param {{ count: number, start: number }} opts
 * @returns {number} float frame index in [0, count - 1], or -1 when inactive
 */
export function scrollToFrame(progress, { count, start }) {
  if (!(progress >= start)) return -1;
  const span = 1 - start;
  const u = span > 0 ? Math.min((progress - start) / span, 1) : 1;
  return u * (count - 1);
}

/**
 * How far a sticky section has been scrolled through, as 0–1.
 * 0 while the section's top is at or below the viewport top; 1 once the
 * section has scrolled its own height minus one viewport past that point.
 * @param {number} top `section.getBoundingClientRect().top`
 * @param {number} sectionHeight `section.offsetHeight`
 * @param {number} viewportHeight
 * @returns {number} 0–1
 */
export function sectionProgress(top, sectionHeight, viewportHeight) {
  const runway = sectionHeight - viewportHeight;
  if (runway <= 0) return 0;
  return Math.min(Math.max(-top / runway, 0), 1);
}

/**
 * Smoothstep ease: 0 below `edge0`, 1 above `edge1`, smoothed between.
 * @param {number} edge0
 * @param {number} edge1
 * @param {number} x
 * @returns {number} 0–1
 */
function smoothstep(edge0, edge1, x) {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Visibility (0–1) of a scroll-linked chapter, given fade-in/hold/fade-out
 * bounds. `outStart`/`outEnd` may be `null` for a chapter that, once shown,
 * stays visible for the rest of the scroll range.
 * @param {number} progress 0–1 section scroll progress
 * @param {{ inStart: number, inEnd: number, outStart: number|null, outEnd: number|null }} range
 * @returns {number} 0–1
 */
export function chapterVisibility(
  progress,
  { inStart, inEnd, outStart, outEnd },
) {
  const fadeIn = smoothstep(inStart, inEnd, progress);
  if (outStart == null || outEnd == null) return fadeIn;
  const fadeOut = 1 - smoothstep(outStart, outEnd, progress);
  return Math.min(fadeIn, fadeOut);
}
