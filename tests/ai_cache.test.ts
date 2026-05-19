import { beforeEach, describe, expect, it } from 'vitest';

import { getAiCache, hashClipBody, setAiCache } from '../src/lib/ai_cache';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('ai_cache', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
  });

  it('produces distinct hashes for different bodies', async () => {
    const a = await hashClipBody('alpha');
    const b = await hashClipBody('beta');
    expect(a).not.toBe(b);
    expect(a).toHaveLength(16);
  });

  it('evicts oldest entries when exceeding 500', async () => {
    for (let index = 0; index < 501; index += 1) {
      const hash = `hash-${String(index).padStart(4, '0')}`;
      await setAiCache(hash, { ai_title: `title-${index}` });
    }

    const first = await getAiCache('hash-0000');
    expect(first).toBeNull();

    const last = await getAiCache('hash-0500');
    expect(last?.ai_title).toBe('title-500');
  });
});
