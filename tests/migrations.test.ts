import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, runMigrations } from '../src/lib/migrations';
import { getItem, setItem, STORAGE_KEYS } from '../src/lib/storage';

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
  chrome?: { runtime?: { id?: string } };
};

beforeEach(() => {
  const g = globalThis as MockGlobal;
  g.__mockStorage = {};
  g.__mockStorageListeners = new Set();
  g.chrome = { runtime: { id: 'test-extension-id' } };
});

describe('migrations', () => {
  it('saves schema_version on first run', async () => {
    await runMigrations();
    const version = await getItem(STORAGE_KEYS.schema_version, null);
    expect(version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('does nothing on second run', async () => {
    await runMigrations();
    const g = globalThis as MockGlobal;
    const snapshot = JSON.stringify(g.__mockStorage);

    await runMigrations();

    expect(JSON.stringify(g.__mockStorage)).toBe(snapshot);
    const version = await getItem(STORAGE_KEYS.schema_version, null);
    expect(version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('adds extension_id when migrating from v1', async () => {
    await setItem(STORAGE_KEYS.schema_version, 1);
    await setItem(STORAGE_KEYS.license, {
      tier: 'trial',
      trial_start_ts: 1,
      premium_activated_ts: null,
    });

    await runMigrations();

    const license = await getItem<Record<string, unknown>>(STORAGE_KEYS.license, {});
    expect(license.extension_id).toBe('test-extension-id');
    expect(await getItem(STORAGE_KEYS.schema_version, null)).toBe(2);
  });
});
