import { describe, expect, it } from 'vitest';
import { isClipboardUrl, prepareUrlClipContent } from '../src/lib/url';

describe('url', () => {
  it('matches http(s) URLs without whitespace', () => {
    expect(isClipboardUrl('https://example.com/path')).toBe(true);
    expect(isClipboardUrl('  https://example.com  ')).toBe(true);
  });

  it('rejects non-URLs', () => {
    expect(isClipboardUrl('hello')).toBe(false);
    expect(isClipboardUrl('https://example.com two')).toBe(false);
  });

  it('truncates long previews only', () => {
    const url = `https://example.com/${'a'.repeat(250)}`;
    const { content, preview } = prepareUrlClipContent(url);
    expect(content).toBe(url);
    expect(preview.length).toBeLessThanOrEqual(201);
  });
});
