import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyLicense } from '../src/lib/billing';
import { getItem, STORAGE_KEYS } from '../src/lib/storage';
import type { LicenseStatus } from '../src/lib/license';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('verifyLicense', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('chrome', { runtime: { id: 'ext-id' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores premium license on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, premium_activated_ts: 123 }),
    } as Response);

    await expect(verifyLicense('key')).resolves.toEqual({
      valid: true,
      premium_activated_ts: 123,
    });
    const license = await getItem<LicenseStatus | null>(STORAGE_KEYS.license, null);
    expect(license?.tier).toBe('premium');
    expect(license?.license_key).toBe('key');
  });

  it('returns invalid response without storing premium', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false }),
    } as Response);

    await expect(verifyLicense('bad')).resolves.toEqual({ valid: false });
    expect(await getItem(STORAGE_KEYS.license, null)).toBeNull();
  });

  it.each([401, 500])('throws for HTTP %s', async (status) => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status } as Response);
    await expect(verifyLicense('key')).rejects.toMatchObject({ status });
  });

  it('throws on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    await expect(verifyLicense('key')).rejects.toThrow('offline');
  });
});
