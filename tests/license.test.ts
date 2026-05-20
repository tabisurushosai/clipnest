import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  activatePremium,
  getLicense,
  getMaxClips,
  TRIAL_DURATION_MS,
} from '../src/lib/license';
type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

beforeEach(() => {
  const g = globalThis as MockGlobal;
  g.__mockStorage = {};
  g.__mockStorageListeners = new Set();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('license', () => {
  it('starts trial automatically on first call', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T00:00:00Z'));

    const status = await getLicense();
    expect(status.tier).toBe('trial');
    expect(status.trial_start_ts).toBe(Date.parse('2026-05-01T00:00:00Z'));
    expect(status.premium_activated_ts).toBeNull();
  });

  it('downgrades to free after 7 days', async () => {
    vi.useFakeTimers();
    const start = Date.parse('2026-05-01T00:00:00Z');
    vi.setSystemTime(start);

    await getLicense(start);

    vi.setSystemTime(start + TRIAL_DURATION_MS + 1);
    const status = await getLicense(start + TRIAL_DURATION_MS + 1);
    expect(status.tier).toBe('free');
  });

  it('prefers premium when premium_activated_ts is set', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));

    const premium = await activatePremium();
    expect(premium.tier).toBe('premium');
    expect(premium.premium_activated_ts).not.toBeNull();

    const status = await getLicense();
    expect(status.tier).toBe('premium');
  });

  it('returns tier-aware max clips', () => {
    expect(getMaxClips('free')).toBe(50);
    expect(getMaxClips('trial')).toBe(5000);
    expect(getMaxClips('premium')).toBe(5000);
  });
});
