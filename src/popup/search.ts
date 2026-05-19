import type { Clip } from '../lib/types';

export function filterClips(clips: Clip[], query: string): Clip[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') {
    return clips;
  }

  return clips.filter((clip) => {
    const haystack = [
      clip.content,
      clip.preview,
      clip.source_title,
      clip.source_url,
    ]
      .join('\n')
      .toLowerCase();
    return haystack.includes(normalized);
  });
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
