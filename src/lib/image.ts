export const MAX_IMAGE_BYTES = 500 * 1024;

/** Data URL のデコード後バイト数（概算） */
export function getDataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) {
    return dataUrl.length;
  }
  const base64 = dataUrl.slice(comma + 1);
  const padding = (base64.match(/=+$/) ?? [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function buildImagePreview(byteSize: number): string {
  const kb = Math.max(1, Math.round(byteSize / 1024));
  return `[画像 ${kb} KB]`;
}

export function prepareImageClipContent(dataUrl: string): { content: string; preview: string } | null {
  const byteSize = getDataUrlByteSize(dataUrl);
  if (byteSize > MAX_IMAGE_BYTES) {
    return null;
  }
  return {
    content: dataUrl,
    preview: buildImagePreview(byteSize),
  };
}
