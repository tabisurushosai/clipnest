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
