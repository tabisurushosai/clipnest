import { describe, expect, it } from 'vitest';

import { buildPage, totalPages, VIRTUAL_PAGE_SIZE } from '../src/popup/virtual';
import type { Clip } from '../src/lib/types';

function clip(id: string): Clip {
  return {
    id,
    type: 'text',
    content: id,
    preview: id,
    source_url: '',
    source_title: '',
    tag_ids: [],
    ai_category: null,
    pinned: false,
    created_at: 0,
    updated_at: 0,
    use_count: 0,
  };
}

describe('virtual list paging', () => {
  const clips = Array.from({ length: 120 }, (_, i) => clip(`c${i}`));

  it('returns empty page for negative index', () => {
    expect(buildPage(clips, -1)).toEqual([]);
  });

  it('returns first page of 50', () => {
    expect(buildPage(clips, 0)).toHaveLength(VIRTUAL_PAGE_SIZE);
    expect(buildPage(clips, 0)[0].id).toBe('c0');
  });

  it('returns partial last page', () => {
    expect(buildPage(clips, 2)).toHaveLength(20);
    expect(totalPages(clips.length)).toBe(3);
  });
});
