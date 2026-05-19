import { beforeEach, describe, expect, it } from 'vitest';

import { getClip, saveClip, updateClip } from '../src/lib/db';

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

const baseClipInput = {
  type: 'text' as const,
  content: 'toggle me',
  preview: 'toggle me',
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

describe('toggle pin (background handler logic)', () => {
  it('flips pinned flag via updateClip', async () => {
    const saved = await saveClip(baseClipInput);
    expect(saved.pinned).toBe(false);

    const clip = await getClip(saved.id);
    expect(clip).not.toBeNull();
    await updateClip(saved.id, { pinned: !clip!.pinned });

    const toggled = await getClip(saved.id);
    expect(toggled?.pinned).toBe(true);

    await updateClip(saved.id, { pinned: !toggled!.pinned });
    const restored = await getClip(saved.id);
    expect(restored?.pinned).toBe(false);
  });
});
