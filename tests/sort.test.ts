import { describe, expect, it } from 'vitest';

import { sortClips } from '../src/popup/sort';
import type { Clip } from '../lib/types';

function makeClip(overrides: Partial<Clip> & Pick<Clip, 'id'>): Clip {
  return {
    type: 'text',
    content: overrides.id,
    preview: overrides.id,
    source_url: '',
    source_title: '',
    tag_ids: [],
    ai_category: null,
    pinned: false,
    created_at: 0,
    updated_at: 0,
    use_count: 0,
    ...overrides,
  };
}

describe('sortClips', () => {
  it('keeps pinned first in newest mode', () => {
    const sorted = sortClips(
      [
        makeClip({ id: 'a', created_at: 3, pinned: false }),
        makeClip({ id: 'b', created_at: 1, pinned: true }),
      ],
      'newest',
    );
    expect(sorted.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('sorts by use_count in most_used mode', () => {
    const sorted = sortClips(
      [
        makeClip({ id: 'a', use_count: 1, created_at: 10 }),
        makeClip({ id: 'b', use_count: 5, created_at: 1 }),
      ],
      'most_used',
    );
    expect(sorted.map((c) => c.id)).toEqual(['b', 'a']);
  });
});
