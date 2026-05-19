import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { callGemini, generateClipCategory } from '../src/lib/ai';
import type { Clip } from '../src/lib/types';

const clip: Clip = {
  id: '1',
  type: 'text',
  content: 'Hello world',
  preview: 'Hello',
  source_url: '',
  source_title: '',
  tag_ids: [],
  ai_category: null,
  pinned: false,
  created_at: 1,
  updated_at: 1,
  use_count: 1,
};

describe('callGemini', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns text on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '  Title here  ' }] } }],
      }),
    } as Response);

    await expect(callGemini('key', 'prompt')).resolves.toBe('Title here');
  });

  it('throws on 401', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(callGemini('bad', 'prompt')).rejects.toMatchObject({ status: 401 });
  });

  it('throws on 429', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 429 } as Response);
    await expect(callGemini('key', 'prompt')).rejects.toMatchObject({ status: 429 });
  });

  it('throws on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    await expect(callGemini('key', 'prompt')).rejects.toThrow('network down');
  });
});

describe('generateClipCategory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to Other for invalid category', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Unknown Thing' }] } }],
      }),
    } as Response);

    await expect(generateClipCategory(clip, 'key')).resolves.toBe('Other');
  });
});
