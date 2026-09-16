'use client';

import { useEffect, useRef, useState } from 'react';
import { preloadOrder } from '../lib/sequence';

/** Upper bound on waiting for decode() — it stalls in background tabs. */
const DECODE_TIMEOUT_MS = 250;

/**
 * Progressively preloads an image sequence, centre frame first.
 *
 * @param {object} opts
 * @param {number} opts.count total frames
 * @param {number} opts.center index to load first
 * @param {(i: number) => string} opts.src maps index → URL
 * @param {number} [opts.concurrency] max in-flight loads
 * @param {boolean} [opts.enabled] set false to skip loading entirely
 * @returns {{ images: React.MutableRefObject<(HTMLImageElement|undefined)[]>, loadedCount: number, ready: boolean }}
 *   `images.current` is a sparse array — a slot is set only once decoded.
 */
export function useImageSequence({
  count,
  center,
  src,
  concurrency = 6,
  enabled = true,
}) {
  const images = useRef(new Array(count));
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let loaded = 0;
    let flushTimer = 0;
    const queue = preloadOrder(count, center);

    // Batch state updates so a burst of decodes doesn't re-render per frame.
    const scheduleFlush = () => {
      if (flushTimer) return;
      flushTimer = window.setTimeout(() => {
        flushTimer = 0;
        if (!cancelled) setLoadedCount(loaded);
      }, 150);
    };

    const loadOne = async (index) => {
      const img = new Image();
      img.decoding = 'async';
      const loadedP = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      img.src = src(index);
      if (!img.complete) await loadedP;
      if (cancelled || !img.naturalWidth) return;
      // Pre-decode off the main thread when we can, but never block on it:
      // browsers defer decode() while the document is hidden, and drawImage
      // will decode synchronously anyway if it has to.
      if (typeof img.decode === 'function') {
        await Promise.race([
          img.decode().catch(() => {}),
          new Promise((resolve) => window.setTimeout(resolve, DECODE_TIMEOUT_MS)),
        ]);
      }
      if (cancelled) return;
      images.current[index] = img;
      loaded += 1;
      if (index === center) setReady(true);
      scheduleFlush();
    };

    const worker = async () => {
      while (!cancelled && queue.length) {
        await loadOne(queue.shift());
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, count); i++) workers.push(worker());
    Promise.all(workers).then(() => {
      if (!cancelled) setLoadedCount(loaded);
    });

    return () => {
      cancelled = true;
      if (flushTimer) window.clearTimeout(flushTimer);
    };
  }, [count, center, src, concurrency, enabled]);

  return { images, loadedCount, ready };
}
