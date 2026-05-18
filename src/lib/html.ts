const HTML_PREVIEW_MAX_LEN = 200;

/** `<script>...</script>` を除去（大文字小文字無視） */
export function sanitizeHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

export function buildHtmlPreview(html: string, maxLen = HTML_PREVIEW_MAX_LEN): string {
  const plain = stripHtmlTags(html).replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLen) {
    return plain;
  }
  return `${plain.slice(0, maxLen)}…`;
}

export function prepareHtmlClipContent(html: string): { content: string; preview: string } {
  const content = sanitizeHtml(html);
  return { content, preview: buildHtmlPreview(content) };
}
