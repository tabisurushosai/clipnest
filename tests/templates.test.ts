import { beforeEach, describe, expect, it } from 'vitest';

import {
  createTemplate,
  deleteTemplate,
  extractVariables,
  fillTemplate,
  incrementUseCount,
  listTemplates,
  updateTemplate,
} from '../src/lib/templates';
import type { Template } from '../src/lib/types';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

beforeEach(() => {
  (globalThis as MockGlobal).__mockStorage = {};
});

describe('templates CRUD', () => {
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

  it('defaults missing category to Uncategorized', async () => {
    const created = await createTemplate({
      title: 'No category',
      body: 'Body',
    });
    expect(created.category).toBe('Uncategorized');
  });

  it('falls back unknown category to Other', async () => {
    const created = await createTemplate({
      title: 'Unknown category',
      body: 'Body',
      category: 'Custom',
    });
    expect(created.category).toBe('Other');
  });

  it('keeps predefined category values', async () => {
    const created = await createTemplate({
      title: 'Email template',
      body: 'Body',
      category: 'Email',
    });
    expect(created.category).toBe('Email');
  });

  it('keeps category when updating body and recalculates variables', async () => {
    const created = await createTemplate({
      title: 'Reply',
      body: 'Hi {{name}}',
      category: 'Reply',
    });

    await updateTemplate(created.id, { body: 'Ticket {{ticket_id}}' });
    const [updated] = await listTemplates();
    expect(updated.category).toBe('Reply');
    expect(updated.variables).toEqual(['ticket_id']);
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

const fillSample: Template = {
  id: 't',
  title: 'Sample',
  body: 'Hello {{name}}, order {{order_id}}',
  category: 'Other',
  variables: ['name', 'order_id'],
  use_count: 0,
  created_at: 1,
  updated_at: 1,
};

describe('fillTemplate', () => {
  it('fills all variables', () => {
    expect(fillTemplate(fillSample, { name: 'Yuki', order_id: 'A1' })).toBe(
      'Hello Yuki, order A1',
    );
  });

  it('leaves missing variables unchanged', () => {
    expect(fillTemplate(fillSample, { name: 'Yuki' })).toBe(
      'Hello Yuki, order {{order_id}}',
    );
  });

  it('leaves template unchanged for empty values', () => {
    expect(fillTemplate(fillSample, {})).toBe(fillSample.body);
  });
});
