import { beforeEach, describe, expect, it } from 'vitest';

import { deleteClip, listClips, saveClip } from '../src/lib/db';

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

const baseClipInput = {
  type: 'text' as const,
  content: 'delete me',
  preview: 'delete me',
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

describe('delete_clip (background handler logic)', () => {
  it('removes clip from storage', async () => {
    const saved = await saveClip(baseClipInput);
    expect(await listClips()).toHaveLength(1);

    await deleteClip(saved.id);
    expect(await listClips()).toHaveLength(0);
  });
});
