import { getMaxClips, type LicenseTier } from '../lib/license';

export function formatClipCounter(count: number, tier: LicenseTier): string {
  const max = getMaxClips(tier);
  if (tier === 'premium') {
    return String(count);
  }
  return `${count} / ${max}`;
}

export function isCounterWarning(count: number, tier: LicenseTier): boolean {
  const max = getMaxClips(tier);
  if (tier === 'premium') {
    return false;
  }
  return count / max > 0.9;
}

export function updateClipCounterElement(
  el: HTMLElement,
  count: number,
  tier: LicenseTier,
): void {
  el.textContent = formatClipCounter(count, tier);
  el.classList.toggle('warning', isCounterWarning(count, tier));
}
