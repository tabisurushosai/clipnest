import { describe, expect, it } from 'vitest';
import {
  getTrialDaysRemaining,
  shouldShowDowngradeBanner,
  shouldShowTrialWarning,
} from '../src/lib/trial_ui';
import { TRIAL_DURATION_MS } from '../src/lib/license';

describe('trial_ui', () => {
  it('computes trial days remaining', () => {
    const start = Date.parse('2026-05-01T00:00:00Z');
    const now = start + 2 * 86_400_000;
    expect(getTrialDaysRemaining(start, now)).toBe(5);
  });

  it('warns within 24 hours', () => {
    expect(shouldShowTrialWarning(1)).toBe(true);
    expect(shouldShowTrialWarning(2)).toBe(false);
  });

  it('shows downgrade banner once after trial', () => {
    expect(shouldShowDowngradeBanner('free', Date.now() - TRIAL_DURATION_MS - 1, false)).toBe(
      true,
    );
    expect(shouldShowDowngradeBanner('free', Date.now() - TRIAL_DURATION_MS - 1, true)).toBe(
      false,
    );
    expect(shouldShowDowngradeBanner('trial', Date.now(), false)).toBe(false);
  });
});
