/**
 * All HTTP calls to our own Next.js route handlers go through this module —
 * never call fetch() directly from a component.
 */

/**
 * @param {string} path - path under /api, e.g. "status"
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiFetch(path, options) {
  const res = await fetch(`/api/${path}`, options);
  if (!res.ok) {
    throw new Error(`API request to /api/${path} failed: ${res.status}`);
  }
  return res.json();
}
