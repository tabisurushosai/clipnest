import { describe, expect, it } from 'vitest';

import { filterClips } from '../src/popup/search';
import type { Clip } from '../src/lib/types';

const sample: Clip = {
  id: '1',
  type: 'text',
  content: 'Hello World body text',
  preview: 'Hello World',
  source_url: 'https://Example.COM/page',
  source_title: 'Example Page Title',
  tag_ids: [],
  ai_category: null,
  pinned: false,
  created_at: 1,
  updated_at: 1,
  use_count: 1,
};

describe('filterClips', () => {
  it('returns all clips for empty query', () => {
    expect(filterClips([sample], '')).toEqual([sample]);
    expect(filterClips([sample], '   ')).toEqual([sample]);
  });

  it('matches preview substring case-insensitively', () => {
    expect(filterClips([sample], 'hello')).toHaveLength(1);
    expect(filterClips([sample], 'WORLD')).toHaveLength(1);
    expect(filterClips([sample], 'nomatch')).toHaveLength(0);
  });

  it('matches source_title and source_url', () => {
    expect(filterClips([sample], 'example.com')).toHaveLength(1);
    expect(filterClips([sample], 'page title')).toHaveLength(1);
  });

  it('matches body content', () => {
    expect(filterClips([sample], 'body text')).toHaveLength(1);
  });
});
