import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enqueue, resetAiQueueForTests } from '../src/lib/ai_queue';
import { getAiErrorCount, recordAiAuthFailure } from '../src/lib/license';
import { getSettings } from '../src/lib/db';

type MockGlobal = typeof globalThis & { __mockStorage?: Record<string, unknown> };

describe('AI auth failure handling', () => {
  beforeEach(() => {
    (globalThis as MockGlobal).__mockStorage = {};
    resetAiQueueForTests();
  });

  it('increments ai_error_count on auth failure', async () => {
    await recordAiAuthFailure();
    expect(await getAiErrorCount()).toBe(1);
  });

  it('disables ai after five auth failures', async () => {
    for (let index = 0; index < 5; index += 1) {
      await recordAiAuthFailure();
    }
    const settings = await getSettings();
    expect(settings.ai_enabled).toBe(false);
  });
});

describe('AI queue 429 retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAiQueueForTests();
  });

  it('retries rate-limited tasks with backoff', async () => {
    let attempts = 0;
    const task = enqueue(async () => {
      attempts += 1;
      if (attempts < 2) {
        const error = new Error('rate limited');
        (error as Error & { status: number }).status = 429;
        throw error;
      }
      return 'ok';
    });

    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.runOnlyPendingTimersAsync();

    await expect(task).resolves.toBe('ok');
    expect(attempts).toBe(2);
    vi.useRealTimers();
  });
});
