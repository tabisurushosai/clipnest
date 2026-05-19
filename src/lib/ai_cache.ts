import { getItem, setItem, STORAGE_KEYS } from './storage';

export type AiCacheEntry = {
  hash: string;
  ai_title?: string;
  ai_category?: string;
  ai_summary?: string;
  last_used_at: number;
};

const MAX_CACHE_ENTRIES = 500;

export async function hashClipBody(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

async function loadCache(): Promise<AiCacheEntry[]> {
  const raw = await getItem<unknown>(STORAGE_KEYS.ai_cache, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (entry): entry is AiCacheEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as AiCacheEntry).hash === 'string',
  );
}

async function persistCache(entries: AiCacheEntry[]): Promise<void> {
  await setItem(STORAGE_KEYS.ai_cache, entries);
}

function evictLru(entries: AiCacheEntry[]): AiCacheEntry[] {
  if (entries.length <= MAX_CACHE_ENTRIES) {
    return entries;
  }
  return [...entries]
    .sort((a, b) => a.last_used_at - b.last_used_at)
    .slice(entries.length - MAX_CACHE_ENTRIES);
}

export async function getAiCache(hash: string): Promise<AiCacheEntry | null> {
  const entries = await loadCache();
  const found = entries.find((entry) => entry.hash === hash);
  if (!found) {
    return null;
  }
  found.last_used_at = Date.now();
  await persistCache(evictLru(entries));
  return found;
}

export async function setAiCache(
  hash: string,
  patch: Omit<AiCacheEntry, 'hash' | 'last_used_at'>,
): Promise<void> {
  const entries = await loadCache();
  const index = entries.findIndex((entry) => entry.hash === hash);
  const next: AiCacheEntry = {
    hash,
    ...patch,
    last_used_at: Date.now(),
  };
  if (index >= 0) {
    entries[index] = { ...entries[index], ...next };
  } else {
    entries.push(next);
  }
  await persistCache(evictLru(entries));
}
