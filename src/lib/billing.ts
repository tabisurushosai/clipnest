import { setItem, STORAGE_KEYS } from './storage';

export const PAYMENT_URL = 'https://buy.stripe.com/CLIPNEST_PAYMENT_LINK_PLACEHOLDER';
export const VERIFY_URL = 'https://clipnest-license.vercel.app/api/verify-license';

export function openPaymentPage(): void {
  const tabs = (
    globalThis as {
      chrome?: { tabs?: { create: (details: { url: string }) => void } };
    }
  ).chrome?.tabs;
  tabs?.create({ url: PAYMENT_URL });
}

export type VerifyLicenseResult = {
  valid: boolean;
  premium_activated_ts?: number;
};

export async function verifyLicense(licenseKey: string): Promise<VerifyLicenseResult> {
  const runtime = (
    globalThis as { chrome?: { runtime?: { id?: string } } }
  ).chrome?.runtime;
  const response = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      license_key: licenseKey,
      extension_id: runtime?.id ?? 'unknown',
    }),
  });

  if (!response.ok) {
    const error = new Error(`License verification failed: ${response.status}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  const result = (await response.json()) as VerifyLicenseResult;
  if (result.valid) {
    await setItem(STORAGE_KEYS.license, {
      tier: 'premium',
      trial_start_ts: null,
      premium_activated_ts: result.premium_activated_ts ?? Date.now(),
      license_key: licenseKey,
    });
  }
  return result;
}
