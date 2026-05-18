import { beforeEach, describe, expect, it } from 'vitest';
import { getAll, getItem, removeItem, setItem, STORAGE_KEYS } from '../src/lib/storage';

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

beforeEach(() => {
  const g = globalThis as MockGlobal;
  g.__mockStorage = {};
  g.__mockStorageListeners = new Set();
});

describe('storage', () => {
  it('set → get → remove → getAll', async () => {
    await setItem(STORAGE_KEYS.settings, { theme: 'dark' });
    const settings = await getItem(STORAGE_KEYS.settings, { theme: 'light' });
    expect(settings).toEqual({ theme: 'dark' });

    const allBefore = await getAll();
    expect(allBefore[STORAGE_KEYS.settings]).toEqual({ theme: 'dark' });

    await removeItem(STORAGE_KEYS.settings);
    const fallback = await getItem(STORAGE_KEYS.settings, { theme: 'light' });
    expect(fallback).toEqual({ theme: 'light' });

    const allAfter = await getAll();
    expect(allAfter[STORAGE_KEYS.settings]).toBeUndefined();
  });
});
