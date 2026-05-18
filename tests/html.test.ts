import { describe, expect, it } from 'vitest';
import { buildHtmlPreview, prepareHtmlClipContent, sanitizeHtml } from '../src/lib/html';

describe('html', () => {
  it('removes script tags', () => {
    const html = '<p>hi</p><script>alert(1)</script><p>bye</p>';
    expect(sanitizeHtml(html)).toBe('<p>hi</p><p>bye</p>');
  });

  it('builds preview from stripped tags', () => {
    const { content, preview } = prepareHtmlClipContent('<b>Hello</b> <i>world</i>');
    expect(content).toBe('<b>Hello</b> <i>world</i>');
    expect(preview).toBe('Hello world');
  });

  it('truncates long preview', () => {
    const long = `<p>${'a'.repeat(250)}</p>`;
    expect(buildHtmlPreview(long).length).toBeLessThanOrEqual(201);
  });
});
