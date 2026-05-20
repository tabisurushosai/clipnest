import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('i18n keys', () => {
  it('ja and en locale keys match', () => {
    const ja = JSON.parse(
      readFileSync(path.join(root, '_locales/ja/messages.json'), 'utf8'),
    ) as Record<string, unknown>;
    const en = JSON.parse(
      readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'),
    ) as Record<string, unknown>;
    const jaKeys = new Set(Object.keys(ja));
    const enKeys = new Set(Object.keys(en));
    const onlyJa = [...jaKeys].filter((key) => !enKeys.has(key));
    const onlyEn = [...enKeys].filter((key) => !jaKeys.has(key));
    expect(onlyJa).toEqual([]);
    expect(onlyEn).toEqual([]);
  });
});
