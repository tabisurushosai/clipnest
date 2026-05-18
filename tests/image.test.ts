import { describe, expect, it } from 'vitest';
import {
  buildImagePreview,
  getDataUrlByteSize,
  MAX_IMAGE_BYTES,
  prepareImageClipContent,
} from '../src/lib/image';

describe('image', () => {
  it('builds preview label in KB', () => {
    expect(buildImagePreview(50 * 1024)).toBe('[画像 50 KB]');
  });

  it('rejects oversized data URLs', () => {
    const big = `data:image/png;base64,${'A'.repeat(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4)}`;
    expect(getDataUrlByteSize(big)).toBeGreaterThan(MAX_IMAGE_BYTES);
    expect(prepareImageClipContent(big)).toBeNull();
  });

  it('accepts small data URLs', () => {
    const small = 'data:image/png;base64,iVBORw0KGgo=';
    const result = prepareImageClipContent(small);
    expect(result).not.toBeNull();
    expect(result?.preview).toMatch(/^\[画像 \d+ KB\]$/);
  });
});
