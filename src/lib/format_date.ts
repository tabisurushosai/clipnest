export type FormatLocale = 'ja' | 'en';

export function resolveFormatLocale(language?: string): FormatLocale {
  return language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function formatDate(timestamp: number, locale: FormatLocale): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (locale === 'ja') {
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${monthNames[date.getMonth()]} ${day}, ${year} ${hours}:${minutes}`;
}
