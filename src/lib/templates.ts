import { getItem, setItem, STORAGE_KEYS } from './storage';
import type { Template, TemplateCategory } from './types';
import { isTemplate, normalizeTemplateCategory } from './types';

export type TemplateInput = {
  title: string;
  body: string;
  category?: TemplateCategory;
};

export function extractVariables(body: string): string[] {
  const variables = new Set<string>();
  const pattern = /\{\{([A-Za-z0-9_]+)\}\}/g;
  let match = pattern.exec(body);
  while (match) {
    variables.add(match[1]);
    match = pattern.exec(body);
  }
  return [...variables];
}

export function fillTemplate(template: Template, values: Record<string, string>): string {
  return template.body.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) {
      return match;
    }
    return values[name];
  });
}

async function loadTemplates(): Promise<Template[]> {
  const raw = await getItem<unknown>(STORAGE_KEYS.templates, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isTemplate).map((template) => ({
    ...template,
    category: normalizeTemplateCategory(template.category),
  }));
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
    category: normalizeTemplateCategory(input.category),
    variables: extractVariables(input.body),
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
    category:
      patch.category === undefined
        ? templates[index].category
        : normalizeTemplateCategory(patch.category),
    variables:
      patch.body === undefined ? templates[index].variables : extractVariables(patch.body),
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
