import { TRIAL_DURATION_MS, type LicenseTier } from './license';

export function getTrialDaysRemaining(trialStartTs: number, now = Date.now()): number {
  const remainingMs = Math.max(0, TRIAL_DURATION_MS - (now - trialStartTs));
  return Math.ceil(remainingMs / 86_400_000);
}

export function shouldShowTrialWarning(daysRemaining: number): boolean {
  return daysRemaining <= 1;
}

export function shouldShowDowngradeBanner(
  tier: LicenseTier,
  trialStartTs: number | null,
  downgradeNotified: boolean,
): boolean {
  return tier === 'free' && trialStartTs !== null && !downgradeNotified;
}
