import { describe, expect, it } from 'vitest';

import { getNextIndex, getPrevIndex } from '../src/popup/keyboard';

describe('keyboard navigation indices', () => {
  it('handles empty list', () => {
    expect(getNextIndex(-1, 0)).toBe(-1);
    expect(getPrevIndex(-1, 0)).toBe(-1);
  });

  it('moves next within bounds', () => {
    expect(getNextIndex(-1, 3)).toBe(0);
    expect(getNextIndex(0, 3)).toBe(1);
    expect(getNextIndex(2, 3)).toBe(2);
  });

  it('moves prev within bounds', () => {
    expect(getPrevIndex(2, 3)).toBe(1);
    expect(getPrevIndex(0, 3)).toBe(0);
    expect(getPrevIndex(-1, 3)).toBe(0);
  });
});
