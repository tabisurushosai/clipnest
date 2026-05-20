import { openPaymentPage } from '../lib/billing';
import { getMessage } from '../lib/i18n';
import type { LicenseStatus } from '../lib/license';
import { getTrialDaysRemaining, shouldShowTrialWarning } from '../lib/trial_ui';

export async function updateTrialBanner(
  license: LicenseStatus,
  trialBanner: HTMLElement | null,
): Promise<void> {
  if (!trialBanner) {
    return;
  }
  if (license.tier !== 'trial' || license.trial_start_ts === null) {
    trialBanner.hidden = true;
    return;
  }
  const days = getTrialDaysRemaining(license.trial_start_ts);
  trialBanner.textContent = getMessage('trial_banner', String(days));
  trialBanner.classList.toggle('is-warning', shouldShowTrialWarning(days));
  trialBanner.hidden = false;
}

export function bindTrialBannerClick(trialBanner: HTMLElement | null): void {
  trialBanner?.addEventListener('click', () => {
    openPaymentPage();
  });
}
