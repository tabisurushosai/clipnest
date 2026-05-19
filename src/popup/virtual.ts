import type { Clip } from '../lib/types';

export const VIRTUAL_PAGE_SIZE = 50;
export const VIRTUAL_THRESHOLD = 100;

export function buildPage(clips: Clip[], page: number, pageSize = VIRTUAL_PAGE_SIZE): Clip[] {
  if (page < 0) {
    return [];
  }
  const start = page * pageSize;
  if (start >= clips.length) {
    return [];
  }
  return clips.slice(start, start + pageSize);
}

export function shouldVirtualize(count: number, threshold = VIRTUAL_THRESHOLD): boolean {
  return count > threshold;
}

export function totalPages(count: number, pageSize = VIRTUAL_PAGE_SIZE): number {
  if (count <= 0) {
    return 0;
  }
  return Math.ceil(count / pageSize);
}
