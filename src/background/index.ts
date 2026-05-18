import { runMigrations } from '../lib/migrations';

const chromeRuntime = (
  globalThis as {
    chrome?: {
      runtime?: {
        onInstalled: { addListener: (callback: () => void) => void };
      };
    };
  }
).chrome?.runtime;

chromeRuntime?.onInstalled.addListener(() => {
  void runMigrations();
});
