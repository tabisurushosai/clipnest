import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enqueue, resetAiQueueForTests } from '../src/lib/ai_queue';

describe('ai_queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAiQueueForTests();
  });

  afterEach(() => {
    resetAiQueueForTests();
    vi.useRealTimers();
  });

  it('runs enqueued tasks sequentially with 1 second spacing', async () => {
    const order: number[] = [];

    const first = enqueue(async () => {
      order.push(1);
      return 'a';
    });
    const second = enqueue(async () => {
      order.push(2);
      return 'b';
    });

    await Promise.resolve();
    expect(order).toEqual([1]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(order).toEqual([1, 2]);

    await expect(first).resolves.toBe('a');
    await expect(second).resolves.toBe('b');
  });
});
