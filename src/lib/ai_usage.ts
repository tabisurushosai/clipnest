import { getItem, setItem } from './storage';

export function formatUsageMonth(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

export function getAiUsageKey(yyyymm: string): string {
  return `clipnest:ai_usage_${yyyymm}`;
}

export async function getAiUsage(yyyymm = formatUsageMonth()): Promise<number> {
  const value = await getItem<unknown>(getAiUsageKey(yyyymm), 0);
  return typeof value === 'number' ? value : 0;
}

export async function incrementAiUsage(date = new Date()): Promise<number> {
  const key = getAiUsageKey(formatUsageMonth(date));
  const current = await getAiUsage(formatUsageMonth(date));
  const next = current + 1;
  await setItem(key, next);
  return next;
}
