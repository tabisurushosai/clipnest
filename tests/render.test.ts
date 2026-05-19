import { describe, expect, it } from 'vitest';

import { sortClipsForDisplay, truncatePreview } from '../src/popup/render';
import type { Clip } from '../src/lib/types';

function makeClip(overrides: Partial<Clip> & Pick<Clip, 'id' | 'created_at'>): Clip {
  return {
    type: 'text',
    content: overrides.content ?? overrides.id,
    preview: overrides.preview ?? overrides.id,
    source_url: 'https://example.com',
    source_title: 'Example',
    tag_ids: [],
    ai_category: null,
    pinned: false,
    updated_at: overrides.created_at,
    use_count: 1,
    ...overrides,
  };
}

describe('render helpers', () => {
  it('sorts empty array', () => {
    expect(sortClipsForDisplay([])).toEqual([]);
  });

  it('sorts single clip', () => {
    const clip = makeClip({ id: 'a', created_at: 100 });
    expect(sortClipsForDisplay([clip]).map((c) => c.id)).toEqual(['a']);
  });

  it('sorts ten clips by created_at desc when unpinned', () => {
    const clips = Array.from({ length: 10 }, (_, index) =>
      makeClip({ id: `c${index}`, created_at: index }),
    );
    const sorted = sortClipsForDisplay(clips);
    expect(sorted.map((c) => c.id)).toEqual([
      'c9',
      'c8',
      'c7',
      'c6',
      'c5',
      'c4',
      'c3',
      'c2',
      'c1',
      'c0',
    ]);
  });

  it('places pinned clips before unpinned regardless of created_at', () => {
    const pinnedOld = makeClip({ id: 'pin', created_at: 1, pinned: true });
    const fresh = makeClip({ id: 'new', created_at: 100, pinned: false });
    const sorted = sortClipsForDisplay([fresh, pinnedOld]);
    expect(sorted.map((c) => c.id)).toEqual(['pin', 'new']);
  });

  it('truncates preview to 200 characters', () => {
    const long = 'a'.repeat(250);
    expect(truncatePreview(long)).toHaveLength(201);
    expect(truncatePreview(long).endsWith('…')).toBe(true);
    expect(truncatePreview('short')).toBe('short');
  });
});
