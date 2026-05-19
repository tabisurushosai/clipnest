import { beforeEach, describe, expect, it } from 'vitest';

import { saveClip } from '../src/lib/db';
import { createTag, deleteTag, listTags, updateTag } from '../src/lib/tags';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('tags CRUD', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
  });

  it('creates, lists, updates, and deletes tags', async () => {
    const created = await createTag('Work', '#3B82F6');
    expect(created.name).toBe('Work');

    await updateTag(created.id, { name: 'Office', color: '#EF4444' });
    const tags = await listTags();
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Office');
    expect(tags[0].color).toBe('#EF4444');

    await deleteTag(created.id);
    expect(await listTags()).toEqual([]);
  });

  it('removes deleted tag ids from clips', async () => {
    const tag = await createTag('Temp', '#10B981');
    const clip = await saveClip({
      type: 'text',
      content: 'hello',
      preview: 'hello',
      source_url: '',
      source_title: '',
      tag_ids: [tag.id],
      ai_category: null,
      pinned: false,
    });

    await deleteTag(tag.id);
    const { getClip } = await import('../src/lib/db');
    const updated = await getClip(clip.id);
    expect(updated?.tag_ids).toEqual([]);
  });
});
