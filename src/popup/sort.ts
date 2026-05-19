import type { Clip } from '../lib/types';

export type SortMode = 'newest' | 'most_used' | 'pinned_first';

export function sortClips(clips: Clip[], mode: SortMode = 'pinned_first'): Clip[] {
  return [...clips].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (mode === 'most_used') {
      return b.use_count - a.use_count || b.created_at - a.created_at;
    }
    return b.created_at - a.created_at;
  });
}
