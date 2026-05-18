import { getItem, setItem, STORAGE_KEYS } from './storage';
import type { Clip, Settings } from './types';
import { isClip, isSettings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  max_clips: 50,
  retention_days: 7,
  theme: 'auto',
  ai_enabled: false,
  shortcuts: { open_popup: 'Command+Shift+V' },
};

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

function getLatestUnpinnedClip(clips: Clip[]): Clip | null {
  const unpinned = clips.filter((clip) => !clip.pinned);
  if (unpinned.length === 0) {
    return null;
  }
  return unpinned.reduce((latest, clip) =>
    clip.updated_at > latest.updated_at ? clip : latest,
  );
}

export async function saveClip(
  clip: Omit<Clip, 'id' | 'created_at' | 'updated_at' | 'use_count'>,
): Promise<Clip> {
  const now = Date.now();
  const clips = await loadClips();
  const latestUnpinned = getLatestUnpinnedClip(clips);

  if (latestUnpinned && latestUnpinned.content === clip.content) {
    const index = clips.findIndex((item) => item.id === latestUnpinned.id);
    const deduped: Clip = {
      ...clips[index],
      updated_at: now,
      use_count: clips[index].use_count + 1,
    };
    clips[index] = deduped;
    await persistClips(clips);
    return deduped;
  }

  const saved: Clip = {
    ...clip,
    id: globalThis.crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    use_count: 1,
  };
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

export async function getSettings(): Promise<Settings> {
  const raw = await getItem<unknown>(STORAGE_KEYS.settings, null);
  if (isSettings(raw)) {
    return raw;
  }
  await setItem(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = {
    ...current,
    ...patch,
    shortcuts: {
      ...current.shortcuts,
      ...(patch.shortcuts ?? {}),
    },
  };
  await setItem(STORAGE_KEYS.settings, next);
  return next;
}
