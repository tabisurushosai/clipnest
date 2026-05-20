import { beforeEach, describe, expect, it } from 'vitest';

import { getSettings, updateSettings } from '../src/lib/db';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('settings persistence', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
  });

  it('saves and loads general settings', async () => {
    await updateSettings({
      max_clips: 500,
      retention_days: 90,
      theme: 'dark',
    });

    const loaded = await getSettings();
    expect(loaded.max_clips).toBe(500);
    expect(loaded.retention_days).toBe(90);
    expect(loaded.theme).toBe('dark');
  });
});
