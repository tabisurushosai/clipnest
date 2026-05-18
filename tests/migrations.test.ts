import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, runMigrations } from '../src/lib/migrations';
import { getItem, STORAGE_KEYS } from '../src/lib/storage';

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

beforeEach(() => {
  const g = globalThis as MockGlobal;
  g.__mockStorage = {};
  g.__mockStorageListeners = new Set();
});

describe('migrations', () => {
  it('saves schema_version=1 on first run', async () => {
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
    expect(version).toBe(1);
  });
});
