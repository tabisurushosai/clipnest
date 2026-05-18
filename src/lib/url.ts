const URL_PREVIEW_MAX_LEN = 200;

export const CLIPBOARD_URL_PATTERN = /^https?:\/\/\S+$/;

export function isClipboardUrl(text: string): boolean {
  return CLIPBOARD_URL_PATTERN.test(text.trim());
}

export function prepareUrlClipContent(content: string): { content: string; preview: string } {
  const preview =
    content.length <= URL_PREVIEW_MAX_LEN ? content : `${content.slice(0, URL_PREVIEW_MAX_LEN)}…`;
  return { content, preview };
}
