import { getLicense } from './license';

export async function requirePremium(_feature: string): Promise<boolean> {
  const license = await getLicense();
  return license.tier === 'trial' || license.tier === 'premium';
}
