import { describe, expect, it } from 'vitest';

import { filterClips, getSinceTimestamp } from '../src/popup/filter';
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
    expect(filterClips([sample], { query: '' })).toEqual([sample]);
    expect(filterClips([sample], { query: '   ' })).toEqual([sample]);
  });

  it('matches preview substring case-insensitively', () => {
    expect(filterClips([sample], { query: 'hello' })).toHaveLength(1);
    expect(filterClips([sample], { query: 'WORLD' })).toHaveLength(1);
    expect(filterClips([sample], { query: 'nomatch' })).toHaveLength(0);
  });

  it('matches source_title and source_url', () => {
    expect(filterClips([sample], { query: 'example.com' })).toHaveLength(1);
    expect(filterClips([sample], { query: 'page title' })).toHaveLength(1);
  });

  it('matches body content', () => {
    expect(filterClips([sample], { query: 'body text' })).toHaveLength(1);
  });

  it('filters by clip type', () => {
    const htmlClip = { ...sample, id: '2', type: 'html' as const };
    expect(filterClips([sample, htmlClip], { type: 'html' })).toHaveLength(1);
    expect(filterClips([sample, htmlClip], { type: 'all' })).toHaveLength(2);
  });

  it('filters by date range today boundary', () => {
    const now = Date.parse('2026-05-19T12:00:00Z');
    const todayStart = getSinceTimestamp('today', now)!;
    const old = { ...sample, id: 'old', created_at: todayStart - 1 };
    const fresh = { ...sample, id: 'new', created_at: todayStart };
    expect(filterClips([old, fresh], { dateRange: 'today', now })).toEqual([fresh]);
  });

  it('filters by tags with AND semantics', () => {
    const tagged = {
      ...sample,
      id: 't1',
      tag_ids: ['a', 'b'],
    };
    expect(filterClips([tagged], { tagIds: ['a', 'b'] })).toHaveLength(1);
    expect(filterClips([tagged], { tagIds: ['a', 'c'] })).toHaveLength(0);
  });
});
