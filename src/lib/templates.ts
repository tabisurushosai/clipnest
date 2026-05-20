import { getItem, setItem, STORAGE_KEYS } from './storage';
import type { Template } from './types';
import { isTemplate } from './types';

export type TemplateInput = {
  title: string;
  body: string;
  category?: string;
};

async function loadTemplates(): Promise<Template[]> {
  const raw = await getItem<unknown>(STORAGE_KEYS.templates, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isTemplate);
}

async function persistTemplates(templates: Template[]): Promise<void> {
  await setItem(STORAGE_KEYS.templates, templates);
}

export async function createTemplate(input: TemplateInput): Promise<Template> {
  const now = Date.now();
  const templates = await loadTemplates();
  const template: Template = {
    id: globalThis.crypto.randomUUID(),
    title: input.title.trim(),
    body: input.body,
    category: input.category ?? 'Uncategorized',
    variables: [],
    use_count: 0,
    created_at: now,
    updated_at: now,
  };
  templates.push(template);
  await persistTemplates(templates);
  return template;
}

export async function listTemplates(): Promise<Template[]> {
  const templates = await loadTemplates();
  return templates.sort((a, b) => a.title.localeCompare(b.title));
}

export async function updateTemplate(id: string, patch: Partial<TemplateInput>): Promise<void> {
  const templates = await loadTemplates();
  const index = templates.findIndex((template) => template.id === id);
  if (index === -1) {
    return;
  }
  templates[index] = {
    ...templates[index],
    ...patch,
    title: patch.title === undefined ? templates[index].title : patch.title.trim(),
    updated_at: Date.now(),
  };
  await persistTemplates(templates);
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await loadTemplates();
  await persistTemplates(templates.filter((template) => template.id !== id));
}

export async function incrementUseCount(id: string): Promise<void> {
  const templates = await loadTemplates();
  const index = templates.findIndex((template) => template.id === id);
  if (index === -1) {
    return;
  }
  templates[index] = {
    ...templates[index],
    use_count: templates[index].use_count + 1,
    updated_at: Date.now(),
  };
  await persistTemplates(templates);
}
