import type { Clip, ClipType } from '../lib/types';

export type ClipTypeFilter = 'all' | ClipType;

export type DateRangeFilter = 'today' | 'week' | 'month' | 'all';

export type FilterOptions = {
  query?: string;
  type?: ClipTypeFilter;
  dateRange?: DateRangeFilter;
  tagIds?: string[];
  now?: number;
};

export function getSinceTimestamp(range: DateRangeFilter, now = Date.now()): number | null {
  const dayMs = 24 * 60 * 60 * 1000;
  const date = new Date(now);
  switch (range) {
    case 'today': {
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }
    case 'week':
      return now - 7 * dayMs;
    case 'month':
      return now - 30 * dayMs;
    case 'all':
    default:
      return null;
  }
}

export function filterClips(clips: Clip[], options: FilterOptions = {}): Clip[] {
  const query = (options.query ?? '').trim().toLowerCase();
  const type = options.type ?? 'all';
  const dateRange = options.dateRange ?? 'all';
  const tagIds = options.tagIds ?? [];
  const since = getSinceTimestamp(dateRange, options.now);

  return clips.filter((clip) => {
    if (type !== 'all' && clip.type !== type) {
      return false;
    }
    if (since !== null && clip.created_at < since) {
      return false;
    }
    if (tagIds.length > 0 && !tagIds.every((id) => clip.tag_ids.includes(id))) {
      return false;
    }
    if (query === '') {
      return true;
    }
    const haystack = [clip.content, clip.preview, clip.source_title, clip.source_url]
      .join('\n')
      .toLowerCase();
    return haystack.includes(query);
  });
}
