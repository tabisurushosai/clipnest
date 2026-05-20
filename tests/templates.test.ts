import { beforeEach, describe, expect, it } from 'vitest';

import {
  createTemplate,
  deleteTemplate,
  extractVariables,
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

describe('extractVariables', () => {
  it('returns empty array when no variables exist', () => {
    expect(extractVariables('plain body')).toEqual([]);
  });

  it('extracts one variable', () => {
    expect(extractVariables('Hello {{name}}')).toEqual(['name']);
  });

  it('extracts multiple variables and removes duplicates', () => {
    expect(extractVariables('{{first}} {{last}} {{first}}')).toEqual(['first', 'last']);
  });

  it('ignores invalid names with spaces', () => {
    expect(extractVariables('{{valid_1}} {{not valid}} {{}}')).toEqual(['valid_1']);
  });

  it('stores extracted variables on create and update', async () => {
    const template = await createTemplate({
      title: 'Vars',
      body: 'Hello {{name}}',
    });
    expect(template.variables).toEqual(['name']);

    await updateTemplate(template.id, { body: 'Order {{order_id}} for {{name}}' });
    const [updated] = await listTemplates();
    expect(updated.variables).toEqual(['order_id', 'name']);
  });
});
