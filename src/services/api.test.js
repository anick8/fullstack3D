import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiFetch } from './api';

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on a successful response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const result = await apiFetch('status');

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith('/api/status', undefined);
  });

  it('throws when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(apiFetch('status')).rejects.toThrow('/api/status failed: 500');
  });
});
