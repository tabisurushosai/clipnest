import { getSettings } from '../lib/db';
import { runMigrations } from '../lib/migrations';

globalThis.console.log('[clipnest] background SW started', new Date().toISOString());

type ChromeRuntime = {
  onInstalled: { addListener: (callback: () => void) => void };
  onStartup: { addListener: (callback: () => void) => void };
};

const chromeRuntime = (globalThis as { chrome?: { runtime?: ChromeRuntime } }).chrome?.runtime;

chromeRuntime?.onInstalled.addListener(() => {
  void runMigrations();
  void getSettings();
});

chromeRuntime?.onStartup.addListener(() => {
  globalThis.console.log('[clipnest] background SW onStartup', new Date().toISOString());
});
