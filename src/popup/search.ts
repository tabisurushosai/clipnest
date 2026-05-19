import type { Clip } from '../lib/types';
import { filterClips as filterClipsWithOptions } from './filter';

/** @deprecated use filter.ts filterClips with options */
export function filterClips(clips: Clip[], query: string): Clip[] {
  return filterClipsWithOptions(clips, { query });
}

export function bindSearch(
  input: HTMLInputElement,
  getClips: () => Clip[],
  onFiltered: (filtered: Clip[]) => void,
): void {
  input.addEventListener('input', () => {
    onFiltered(filterClips(getClips(), input.value));
  });
}
