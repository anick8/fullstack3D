import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImageSequence } from './useImageSequence';

/** Minimal Image stub: fires onload on the next tick, then decode() resolves. */
class FakeImage {
  static srcs = [];
  constructor() {
    this.naturalWidth = 0;
    this.complete = false;
    this.onload = null;
    this._src = '';
  }
  set src(v) {
    this._src = v;
    FakeImage.srcs.push(v);
    queueMicrotask(() => {
      this.naturalWidth = 1276;
      this.complete = true;
      if (this.onload) this.onload();
    });
  }
  get src() {
    return this._src;
  }
  decode() {
    return Promise.resolve();
  }
}

describe('useImageSequence', () => {
  const RealImage = globalThis.Image;

  beforeEach(() => {
    FakeImage.srcs = [];
    globalThis.Image = FakeImage;
  });

  afterEach(() => {
    globalThis.Image = RealImage;
    vi.restoreAllMocks();
  });

  it('loads the centre frame first, then fans outward', async () => {
    const src = (i) => `/f/${i}`;
    const { result } = renderHook(() =>
      useImageSequence({ count: 5, center: 2, src, concurrency: 1 })
    );

    await waitFor(() => expect(result.current.loadedCount).toBe(5));
    expect(FakeImage.srcs).toEqual(['/f/2', '/f/1', '/f/3', '/f/0', '/f/4']);
  });

  it('flips ready once the centre frame decodes and fills the sparse array', async () => {
    const src = (i) => `/f/${i}`;
    const { result } = renderHook(() =>
      useImageSequence({ count: 3, center: 1, src, concurrency: 3 })
    );

    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(result.current.loadedCount).toBe(3));
    expect(result.current.images.current.filter(Boolean)).toHaveLength(3);
  });

  it('does nothing when disabled', async () => {
    const src = (i) => `/f/${i}`;
    const { result } = renderHook(() =>
      useImageSequence({ count: 3, center: 1, src, enabled: false })
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(FakeImage.srcs).toEqual([]);
    expect(result.current.ready).toBe(false);
  });
});
