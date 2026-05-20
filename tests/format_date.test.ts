import { describe, expect, it } from 'vitest';

import { formatDate, resolveFormatLocale } from '../src/lib/format_date';

describe('formatDate', () => {
  const ts = Date.parse('2026-05-19T14:30:00');

  it('formats Japanese locale', () => {
    expect(formatDate(ts, 'ja')).toBe('2026/05/19 14:30');
  });

  it('formats English locale', () => {
    expect(formatDate(ts, 'en')).toBe('May 19, 2026 14:30');
  });

  it('resolves locale from language tag', () => {
    expect(resolveFormatLocale('ja-JP')).toBe('ja');
    expect(resolveFormatLocale('en-US')).toBe('en');
  });
});
