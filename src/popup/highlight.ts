export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function highlightMatch(text: string, query: string): string {
  const normalized = query.trim();
  if (normalized === '') {
    return escapeHtml(text);
  }

  const escaped = escapeHtml(text);
  const lowerText = text.toLowerCase();
  const lowerQuery = normalized.toLowerCase();
  if (!lowerText.includes(lowerQuery)) {
    return escaped;
  }

  let result = '';
  let start = 0;
  let index = lowerText.indexOf(lowerQuery, start);
  while (index !== -1) {
    result += escapeHtml(text.slice(start, index));
    result += `<mark>${escapeHtml(text.slice(index, index + normalized.length))}</mark>`;
    start = index + normalized.length;
    index = lowerText.indexOf(lowerQuery, start);
  }
  result += escapeHtml(text.slice(start));
  return result;
}
