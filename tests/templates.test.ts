import { beforeEach, describe, expect, it } from 'vitest';

import {
  createTemplate,
  deleteTemplate,
  incrementUseCount,
  listTemplates,
  updateTemplate,
} from '../src/lib/templates';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('templates CRUD', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
  });

  it('creates, lists, updates, deletes, and increments use_count', async () => {
    const created = await createTemplate({
      title: 'Greeting',
      body: 'Hello',
      category: 'Other',
    });

    expect(created.use_count).toBe(0);
    expect(await listTemplates()).toHaveLength(1);

    await updateTemplate(created.id, { title: 'Welcome', body: 'Hi' });
    const updated = await listTemplates();
    expect(updated[0].title).toBe('Welcome');
    expect(updated[0].body).toBe('Hi');

    await incrementUseCount(created.id);
    const used = await listTemplates();
    expect(used[0].use_count).toBe(1);

    await deleteTemplate(created.id);
    expect(await listTemplates()).toEqual([]);
  });
});
