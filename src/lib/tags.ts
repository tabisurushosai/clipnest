import { getClip, listClips, updateClip } from './db';
import { getItem, setItem, STORAGE_KEYS } from './storage';
import type { Tag } from './types';
import { isTag } from './types';

async function loadTags(): Promise<Tag[]> {
  const raw = await getItem<unknown>(STORAGE_KEYS.tags, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isTag);
}

async function persistTags(tags: Tag[]): Promise<void> {
  await setItem(STORAGE_KEYS.tags, tags);
}

export async function listTags(): Promise<Tag[]> {
  const tags = await loadTags();
  return tags.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const tags = await loadTags();
  const tag: Tag = {
    id: globalThis.crypto.randomUUID(),
    name: name.trim(),
    color,
  };
  tags.push(tag);
  await persistTags(tags);
  return tag;
}

export async function updateTag(id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>): Promise<void> {
  const tags = await loadTags();
  const index = tags.findIndex((tag) => tag.id === id);
  if (index === -1) {
    return;
  }
  tags[index] = { ...tags[index], ...patch };
  await persistTags(tags);
}

export async function deleteTag(id: string): Promise<void> {
  const tags = await loadTags();
  await persistTags(tags.filter((tag) => tag.id !== id));

  const clips = await listClips();
  for (const clip of clips) {
    if (!clip.tag_ids.includes(id)) {
      continue;
    }
    await updateClip(clip.id, {
      tag_ids: clip.tag_ids.filter((tagId) => tagId !== id),
    });
  }
}

export async function addTagToClip(clipId: string, tagId: string): Promise<void> {
  const clip = await getClip(clipId);
  if (!clip || clip.tag_ids.includes(tagId)) {
    return;
  }
  await updateClip(clipId, { tag_ids: [...clip.tag_ids, tagId] });
}
