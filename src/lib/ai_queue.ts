type QueueTask<T> = () => Promise<T>;

const queue: Array<{
  run: QueueTask<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

let processing = false;
let lastRunAt = 0;
const MIN_INTERVAL_MS = 1000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type AiQueueErrorHandler = (error: unknown, attempt: number) => Promise<'retry' | 'abort'>;

let errorHandler: AiQueueErrorHandler | null = null;

export function setAiQueueErrorHandler(handler: AiQueueErrorHandler): void {
  errorHandler = handler;
}

async function runWithRetry<T>(task: QueueTask<T>): Promise<T> {
  let attempt = 0;
  while (attempt < 4) {
    try {
      return await task();
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        throw error;
      }
      if (status === 429 && attempt < 3) {
        await sleep(2 ** attempt * 1000);
        attempt += 1;
        continue;
      }
      if (errorHandler) {
        const action = await errorHandler(error, attempt);
        if (action === 'retry' && attempt < 3) {
          attempt += 1;
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error('AI queue retries exhausted');
}

async function processQueue(): Promise<void> {
  if (processing) {
    return;
  }
  processing = true;
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      break;
    }
    const waitMs = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRunAt));
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    try {
      const result = await runWithRetry(item.run);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
    lastRunAt = Date.now();
  }
  processing = false;
}

export function enqueue<T>(task: QueueTask<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({
      run: task as QueueTask<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    void processQueue();
  });
}

export function resetAiQueueForTests(): void {
  queue.length = 0;
  processing = false;
  lastRunAt = 0;
}
