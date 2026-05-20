import { getMessage } from '../lib/i18n';
import type { LicenseStatus } from '../lib/license';
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';
import { shouldShowDowngradeBanner } from '../lib/trial_ui';

export async function updateDowngradeBanner(
  license: LicenseStatus,
  downgradeBanner: HTMLElement | null,
): Promise<void> {
  if (!downgradeBanner) {
    return;
  }
  const notified = await getItem<boolean>(STORAGE_KEYS.downgrade_notified, false);
  if (!shouldShowDowngradeBanner(license.tier, license.trial_start_ts, notified)) {
    downgradeBanner.hidden = true;
    return;
  }
  downgradeBanner.textContent = getMessage('downgrade_notice');
  downgradeBanner.hidden = false;
  await setItem(STORAGE_KEYS.downgrade_notified, true);
}
