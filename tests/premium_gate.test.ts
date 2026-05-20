import { beforeEach, describe, expect, it } from 'vitest';

import { requirePremium } from '../src/lib/premium_gate';
import { setItem, STORAGE_KEYS } from '../src/lib/storage';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('requirePremium', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
  });

  it('rejects free tier', async () => {
    await setItem(STORAGE_KEYS.license, {
      tier: 'free',
      trial_start_ts: Date.now() - 8 * 86_400_000,
      premium_activated_ts: null,
    });
    await expect(requirePremium('import')).resolves.toBe(false);
  });

  it('allows trial tier', async () => {
    await setItem(STORAGE_KEYS.license, {
      tier: 'trial',
      trial_start_ts: Date.now(),
      premium_activated_ts: null,
    });
    await expect(requirePremium('ai')).resolves.toBe(true);
  });

  it('allows premium tier', async () => {
    await setItem(STORAGE_KEYS.license, {
      tier: 'premium',
      trial_start_ts: null,
      premium_activated_ts: Date.now(),
    });
    await expect(requirePremium('templates')).resolves.toBe(true);
  });
});
