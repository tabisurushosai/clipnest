import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateClipTitle } from '../src/lib/ai';
import { getClip, saveClip, updateClip } from '../src/lib/db';
import type { Clip } from '../src/lib/types';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

const baseClip: Omit<Clip, 'id' | 'created_at' | 'updated_at' | 'use_count'> = {
  type: 'text',
  content: 'Clipboard content for title generation',
  preview: 'Clipboard content',
  source_url: '',
  source_title: '',
  tag_ids: [],
  ai_category: null,
  pinned: false,
};

describe('generateClipTitle persistence', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores mocked title on clip.ai_title', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Meeting notes snippet' }] } }],
      }),
    } as Response);

    const clip = await saveClip(baseClip);
    const title = await generateClipTitle(clip, 'test-api-key');
    await updateClip(clip.id, { ai_title: title });

    const updated = await getClip(clip.id);
    expect(updated?.ai_title).toBe('Meeting notes snippet');
  });
});
