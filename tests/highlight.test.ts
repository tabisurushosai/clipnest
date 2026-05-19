import { describe, expect, it } from 'vitest';

import { highlightMatch } from '../src/popup/highlight';

describe('highlightMatch', () => {
  it('escapes html when query empty', () => {
    expect(highlightMatch('<b>hi</b>', '')).toBe('&lt;b&gt;hi&lt;/b&gt;');
  });

  it('wraps single match case-insensitively', () => {
    expect(highlightMatch('Hello World', 'world')).toBe('Hello <mark>World</mark>');
  });

  it('wraps multiple matches', () => {
    expect(highlightMatch('aaa', 'a')).toBe('<mark>a</mark><mark>a</mark><mark>a</mark>');
  });

  it('escapes special regex chars in query', () => {
    expect(highlightMatch('price $5', '$5')).toContain('<mark>$5</mark>');
  });
});
