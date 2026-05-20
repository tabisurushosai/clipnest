import { describe, expect, it } from 'vitest';
import { getClipIdAtIndex, wouldDedupeClipSave } from '../src/lib/quick_copy';
import type { Clip } from '../src/lib/types';

function clip(id: string, createdAt: number, content: string, pinned = false): Clip {
  return {
    id,
    content,
    preview: content,
    type: 'text',
    created_at: createdAt,
    updated_at: createdAt,
    use_count: 0,
    pinned,
    tag_ids: [],
    source_url: null,
    source_title: null,
    source_favicon_url: null,
    ai_title: null,
    ai_category: null,
    ai_summary: null,
  };
}

describe('quick_copy', () => {
  it('returns newest clip at index 0', () => {
    const clips = [clip('a', 1, 'old'), clip('b', 3, 'new'), clip('c', 2, 'mid')];
    expect(getClipIdAtIndex(clips, 0)).toBe('b');
    expect(getClipIdAtIndex(clips, 2)).toBe('a');
  });

  it('detects dedupe against latest unpinned clip', () => {
    const clips = [clip('a', 1, 'same', true), clip('b', 2, 'same')];
    expect(wouldDedupeClipSave(clips, 'same')).toBe(true);
    expect(wouldDedupeClipSave(clips, 'other')).toBe(false);
  });
});
