import { getItem, setItem, STORAGE_KEYS } from './storage';

export type LicenseTier = 'free' | 'trial' | 'premium';

export type LicenseStatus = {
  tier: LicenseTier;
  trial_start_ts: number | null;
  premium_activated_ts: number | null;
};

export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const LICENSE_DEFAULT: LicenseStatus = {
  tier: 'free',
  trial_start_ts: null,
  premium_activated_ts: null,
};

function isLicenseStatus(value: unknown): value is LicenseStatus {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    (record.tier === 'free' || record.tier === 'trial' || record.tier === 'premium') &&
    (record.trial_start_ts === null || typeof record.trial_start_ts === 'number') &&
    (record.premium_activated_ts === null || typeof record.premium_activated_ts === 'number')
  );
}

export function getMaxClips(tier: LicenseTier): number {
  if (tier === 'free') {
    return 50;
  }
  return 5000;
}

export async function getLicense(now = Date.now()): Promise<LicenseStatus> {
  const stored = await getItem<unknown>(STORAGE_KEYS.license, null);
  const license: LicenseStatus = isLicenseStatus(stored)
    ? { ...LICENSE_DEFAULT, ...stored }
    : { ...LICENSE_DEFAULT };

  if (license.premium_activated_ts !== null) {
    return { ...license, tier: 'premium' };
  }

  let trialStart = license.trial_start_ts;
  if (trialStart === null) {
    trialStart = now;
    const started: LicenseStatus = {
      tier: 'trial',
      trial_start_ts: trialStart,
      premium_activated_ts: null,
    };
    await setItem(STORAGE_KEYS.license, started);
    await setItem(STORAGE_KEYS.trial_start_ts, trialStart);
    return started;
  }

  if (now - trialStart > TRIAL_DURATION_MS) {
    const expired: LicenseStatus = {
      tier: 'free',
      trial_start_ts: trialStart,
      premium_activated_ts: null,
    };
    await setItem(STORAGE_KEYS.license, expired);
    return expired;
  }

  const trial: LicenseStatus = {
    tier: 'trial',
    trial_start_ts: trialStart,
    premium_activated_ts: null,
  };
  await setItem(STORAGE_KEYS.license, trial);
  return trial;
}

export async function activatePremium(now = Date.now()): Promise<LicenseStatus> {
  const current = await getItem<unknown>(STORAGE_KEYS.license, null);
  const trialStart =
    isLicenseStatus(current) && current.trial_start_ts !== null
      ? current.trial_start_ts
      : await getItem<number | null>(STORAGE_KEYS.trial_start_ts, null);

  const premium: LicenseStatus = {
    tier: 'premium',
    trial_start_ts: trialStart,
    premium_activated_ts: now,
  };
  await setItem(STORAGE_KEYS.license, premium);
  return premium;
}
