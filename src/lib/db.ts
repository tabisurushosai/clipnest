import { getItem, setItem, STORAGE_KEYS } from './storage';
import type { Clip } from './types';
import { isClip } from './types';

async function loadClips(): Promise<Clip[]> {
  const raw = await getItem<unknown>(STORAGE_KEYS.clips, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isClip);
}

async function persistClips(clips: Clip[]): Promise<void> {
  await setItem(STORAGE_KEYS.clips, clips);
}

export async function listClips(): Promise<Clip[]> {
  const clips = await loadClips();
  return clips.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.created_at - a.created_at;
  });
}

export async function getClip(id: string): Promise<Clip | null> {
  const clips = await loadClips();
  return clips.find((clip) => clip.id === id) ?? null;
}

export async function saveClip(
  clip: Omit<Clip, 'id' | 'created_at' | 'updated_at' | 'use_count'>,
): Promise<Clip> {
  const now = Date.now();
  const saved: Clip = {
    ...clip,
    id: globalThis.crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    use_count: 0,
  };
  const clips = await loadClips();
  clips.push(saved);
  await persistClips(clips);
  return saved;
}

export async function updateClip(id: string, patch: Partial<Clip>): Promise<void> {
  const clips = await loadClips();
  const index = clips.findIndex((clip) => clip.id === id);
  if (index === -1) {
    return;
  }
  clips[index] = {
    ...clips[index],
    ...patch,
    id: clips[index].id,
    updated_at: Date.now(),
  };
  await persistClips(clips);
}

export async function deleteClip(id: string): Promise<void> {
  const clips = await loadClips();
  await persistClips(clips.filter((clip) => clip.id !== id));
}

export async function incrementUseCount(id: string): Promise<void> {
  const clips = await loadClips();
  const index = clips.findIndex((clip) => clip.id === id);
  if (index === -1) {
    return;
  }
  clips[index] = {
    ...clips[index],
    use_count: clips[index].use_count + 1,
    updated_at: Date.now(),
  };
  await persistClips(clips);
}

export async function pruneClips(maxCount: number, retentionMs: number): Promise<number> {
  const now = Date.now();
  const clips = await loadClips();
  const pinned = clips.filter((clip) => clip.pinned);
  const unpinned = clips
    .filter((clip) => !clip.pinned)
    .sort((a, b) => a.created_at - b.created_at);

  const idsToRemove = new Set<string>();

  for (const clip of unpinned) {
    if (now - clip.created_at > retentionMs) {
      idsToRemove.add(clip.id);
    }
  }

  const remainingUnpinned = unpinned.filter((clip) => !idsToRemove.has(clip.id));
  const overflow = pinned.length + remainingUnpinned.length - maxCount;
  if (overflow > 0) {
    for (let i = 0; i < overflow && i < remainingUnpinned.length; i++) {
      idsToRemove.add(remainingUnpinned[i].id);
    }
  }

  if (idsToRemove.size === 0) {
    return 0;
  }

  await persistClips(clips.filter((clip) => !idsToRemove.has(clip.id)));
  return idsToRemove.size;
}
