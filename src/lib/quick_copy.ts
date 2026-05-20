import type { Clip } from './types';

export function getClipIdAtIndex(clips: Clip[], index: number): string | undefined {
  const sorted = [...clips].sort((a, b) => b.created_at - a.created_at);
  return sorted[index]?.id;
}

export function wouldDedupeClipSave(clips: Clip[], content: string): boolean {
  const unpinned = clips.filter((clip) => !clip.pinned);
  if (unpinned.length === 0) {
    return false;
  }
  const latest = unpinned.reduce((current, clip) =>
    clip.created_at >= current.created_at ? clip : current,
  );
  return latest.content === content;
}
