import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  deleteClip,
  getSettings,
  listClips,
  pruneClips,
  saveClip,
  updateClip,
  updateSettings,
} from '../src/lib/db';

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

const baseClipInput = {
  type: 'text' as const,
  content: 'hello',
  preview: 'hello',
  source_url: 'https://example.com',
  source_title: 'Example',
  tag_ids: [] as string[],
  ai_category: null,
  pinned: false,
};

beforeEach(() => {
  const g = globalThis as MockGlobal;
  g.__mockStorage = {};
  g.__mockStorageListeners = new Set();
});

describe('clip CRUD', () => {
  it('save → list → update → delete → prune', async () => {
    const saved = await saveClip(baseClipInput);
    expect(saved.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(saved.use_count).toBe(1);
    expect(saved.created_at).toBe(saved.updated_at);

    const listed = await listClips();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(saved.id);

    await updateClip(saved.id, { content: 'updated', preview: 'updated' });
    const afterUpdate = await listClips();
    expect(afterUpdate[0].content).toBe('updated');
    expect(afterUpdate[0].updated_at).toBeGreaterThanOrEqual(saved.updated_at);

    await deleteClip(saved.id);
    expect(await listClips()).toHaveLength(0);

    const old = await saveClip({ ...baseClipInput, content: 'old' });
    await saveClip({ ...baseClipInput, content: 'new' });
    await updateClip(old.id, { created_at: Date.now() - 60_000 });

    const removed = await pruneClips(1, Number.POSITIVE_INFINITY);
    expect(removed).toBe(1);
    const remaining = await listClips();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].content).toBe('new');
  });

  it('returns DEFAULT on first getSettings and reflects updateSettings', async () => {
    const initial = await getSettings();
    expect(initial).toEqual(DEFAULT_SETTINGS);
    expect(initial).not.toHaveProperty('gemini_api_key');

    const updated = await updateSettings({ theme: 'dark', max_clips: 100 });
    expect(updated.theme).toBe('dark');
    expect(updated.max_clips).toBe(100);
    expect(updated.shortcuts.open_popup).toBe('Command+Shift+V');

    const loaded = await getSettings();
    expect(loaded).toEqual(updated);
  });

  it('dedupes consecutive identical clips and increments use_count', async () => {
    const input = { ...baseClipInput, content: 'same body' };

    await saveClip(input);
    await saveClip(input);
    const third = await saveClip(input);

    const listed = await listClips();
    expect(listed).toHaveLength(1);
    expect(listed[0].content).toBe('same body');
    expect(third.use_count).toBe(3);
    expect(listed[0].use_count).toBe(3);
  });

  it('lists pinned clips before unpinned clips', async () => {
    const unpinned = await saveClip(baseClipInput);
    const pinned = await saveClip({ ...baseClipInput, content: 'pinned', pinned: true });

    await updateClip(unpinned.id, { created_at: Date.now() + 1000 });

    const listed = await listClips();
    expect(listed[0].id).toBe(pinned.id);
    expect(listed[1].id).toBe(unpinned.id);
  });
});
