import { describe, it, expect } from "vitest";
import {
  chapterVisibility,
  coverRect,
  nearestLoaded,
  pointerToFrame,
  preloadOrder,
  scrollToFrame,
  sectionProgress,
} from "./sequence";

describe("preloadOrder", () => {
  it("starts at the centre and fans outward", () => {
    expect(preloadOrder(7, 3)).toEqual([3, 2, 4, 1, 5, 0, 6]);
  });

  it("covers every index exactly once", () => {
    const order = preloadOrder(91, 50);
    expect(order).toHaveLength(91);
    expect(new Set(order).size).toBe(91);
  });
});

describe("nearestLoaded", () => {
  it("returns the index itself when loaded", () => {
    expect(nearestLoaded([0, 1, 1, 0], 2)).toBe(2);
  });

  it("falls back to the nearest loaded neighbour", () => {
    expect(nearestLoaded([0, 0, 0, 1, 0, 0], 0)).toBe(3);
    expect(nearestLoaded([1, 0, 0, 0, 0, 1], 2)).toBe(0);
  });

  it("never returns undefined, only -1 when nothing is loaded", () => {
    expect(nearestLoaded([0, 0, 0], 1)).toBe(-1);
    expect(nearestLoaded([], 0)).toBe(-1);
  });

  it("clamps out-of-range and fractional indices", () => {
    expect(nearestLoaded([1, 1, 1], 9.7)).toBe(2);
    expect(nearestLoaded([1, 1, 1], -3)).toBe(0);
  });
});

describe("pointerToFrame", () => {
  const opts = { count: 91, center: 50, deadZone: 0.04 };

  it("holds the centre frame inside the dead zone", () => {
    expect(pointerToFrame(500, 1000, opts)).toBe(50);
    expect(pointerToFrame(530, 1000, opts)).toBe(50);
  });

  it("maps the left edge to frame 0 and the right edge to the last frame", () => {
    expect(pointerToFrame(0, 1000, opts)).toBeCloseTo(0);
    expect(pointerToFrame(1000, 1000, opts)).toBeCloseTo(90);
  });

  it("is monotonic from left to right", () => {
    let prev = -1;
    for (let x = 0; x <= 1000; x += 50) {
      const f = pointerToFrame(x, 1000, opts);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });

  it("returns the centre for a zero-width viewport", () => {
    expect(pointerToFrame(10, 0, opts)).toBe(50);
  });
});

describe("coverRect", () => {
  it("fills a wider viewport by scaling to width and cropping height", () => {
    const r = coverRect(1276, 720, 2000, 800, { x: 0, y: 0, w: 0, h: 0 });
    expect(r.w).toBeCloseTo(2000);
    expect(r.h).toBeGreaterThan(800);
    expect(r.x).toBe(0);
    expect(r.y).toBeLessThan(0);
  });

  it("fills a taller viewport by scaling to height and cropping width", () => {
    const r = coverRect(1276, 720, 400, 800, { x: 0, y: 0, w: 0, h: 0 });
    expect(r.h).toBeCloseTo(800);
    expect(r.w).toBeGreaterThan(400);
    expect(r.x).toBeLessThan(0);
  });
});

describe("scrollToFrame", () => {
  const opts = { count: 151, start: 0.1 };
  it("is inactive before the start threshold", () => {
    expect(scrollToFrame(0, opts)).toBe(-1);
    expect(scrollToFrame(0.0999, opts)).toBe(-1);
    expect(scrollToFrame(NaN, opts)).toBe(-1);
  });
  it("maps start → frame 0 and 100% → last frame", () => {
    expect(scrollToFrame(0.1, opts)).toBe(0);
    expect(scrollToFrame(1, opts)).toBe(150);
    expect(scrollToFrame(1.5, opts)).toBe(150);
  });
  it("is linear between start and end", () => {
    expect(scrollToFrame(0.55, opts)).toBeCloseTo(75, 5);
  });
});

describe('sectionProgress', () => {
  it('is 0 while the section top has not passed the viewport top', () => {
    expect(sectionProgress(0, 2000, 800)).toBe(0);
    expect(sectionProgress(500, 2000, 800)).toBe(0);
  });

  it('is 1 once scrolled through the full runway', () => {
    expect(sectionProgress(-1200, 2000, 800)).toBe(1);
    expect(sectionProgress(-5000, 2000, 800)).toBe(1);
  });

  it('is linear in between', () => {
    expect(sectionProgress(-600, 2000, 800)).toBeCloseTo(0.5, 5);
  });

  it('is 0 when the section is not taller than the viewport', () => {
    expect(sectionProgress(-100, 800, 800)).toBe(0);
    expect(sectionProgress(-100, 600, 800)).toBe(0);
  });
});

describe('chapterVisibility', () => {
  const range = { inStart: 0.2, inEnd: 0.3, outStart: 0.5, outEnd: 0.6 };

  it('is 0 before fade-in and after fade-out', () => {
    expect(chapterVisibility(0, range)).toBe(0);
    expect(chapterVisibility(1, range)).toBe(0);
  });

  it('is 1 during the hold', () => {
    expect(chapterVisibility(0.4, range)).toBe(1);
  });

  it('is between 0 and 1 mid-fade', () => {
    const v = chapterVisibility(0.25, range);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });

  it('stays visible once shown when outStart/outEnd are null', () => {
    const holdRange = { inStart: 0.9, inEnd: 0.95, outStart: null, outEnd: null };
    expect(chapterVisibility(0.95, holdRange)).toBe(1);
    expect(chapterVisibility(1, holdRange)).toBe(1);
  });
});
