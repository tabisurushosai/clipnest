export const STORAGE_KEYS = {
  clips: 'clipnest:clips',
  tags: 'clipnest:tags',
  templates: 'clipnest:templates',
  license: 'clipnest:license',
  settings: 'clipnest:settings',
  trial_start_ts: 'clipnest:trial_start_ts',
  schema_version: 'clipnest:schema_version',
} as const;

type StorageArea = {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
};

type MockGlobal = typeof globalThis & {
  __mockStorage?: Record<string, unknown>;
  __mockStorageListeners?: Set<(key: string, newValue: unknown) => void>;
};

function ensureMockStorage(): Record<string, unknown> {
  const g = globalThis as MockGlobal;
  if (!g.__mockStorage) {
    g.__mockStorage = {};
  }
  return g.__mockStorage;
}

function ensureMockListeners(): Set<(key: string, newValue: unknown) => void> {
  const g = globalThis as MockGlobal;
  if (!g.__mockStorageListeners) {
    g.__mockStorageListeners = new Set();
  }
  return g.__mockStorageListeners;
}

function notifyMockChange(key: string, newValue: unknown): void {
  for (const listener of ensureMockListeners()) {
    listener(key, newValue);
  }
}

function createMockStorageArea(): StorageArea {
  return {
    get(keys) {
      const store = ensureMockStorage();
      if (keys === null) {
        return Promise.resolve({ ...store });
      }
      const keyList = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};
      for (const key of keyList) {
        if (Object.prototype.hasOwnProperty.call(store, key)) {
          result[key] = store[key];
        }
      }
      return Promise.resolve(result);
    },
    set(items) {
      const store = ensureMockStorage();
      for (const [key, value] of Object.entries(items)) {
        store[key] = value;
        notifyMockChange(key, value);
      }
      return Promise.resolve();
    },
    remove(keys) {
      const store = ensureMockStorage();
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const key of keyList) {
        delete store[key];
        notifyMockChange(key, undefined);
      }
      return Promise.resolve();
    },
  };
}

function getStorageArea(): StorageArea {
  const chromeApi = (globalThis as { chrome?: { storage?: { local?: StorageArea } } }).chrome;
  if (chromeApi?.storage?.local) {
    return chromeApi.storage.local;
  }
  return createMockStorageArea();
}

export async function getItem<T>(key: string, fallback: T): Promise<T> {
  const result = await getStorageArea().get(key);
  const value = result[key];
  return value !== undefined ? (value as T) : fallback;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await getStorageArea().set({ [key]: value });
}

export async function removeItem(key: string): Promise<void> {
  await getStorageArea().remove(key);
}

export async function getAll(): Promise<Record<string, unknown>> {
  return getStorageArea().get(null);
}

export function onChange<T>(key: string, callback: (newVal: T) => void): () => void {
  const chromeApi = (globalThis as {
    chrome?: {
      storage?: {
        onChanged?: {
          addListener: (
            callback: (
              changes: Record<string, { newValue?: unknown }>,
              areaName: string,
            ) => void,
          ) => void;
          removeListener: (
            callback: (
              changes: Record<string, { newValue?: unknown }>,
              areaName: string,
            ) => void,
          ) => void;
        };
      };
    };
  }).chrome;

  if (chromeApi?.storage?.onChanged) {
    const listener = (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ): void => {
      if (areaName !== 'local') {
        return;
      }
      const change = changes[key];
      if (change) {
        callback(change.newValue as T);
      }
    };
    chromeApi.storage.onChanged.addListener(listener);
    return () => {
      chromeApi.storage?.onChanged?.removeListener(listener);
    };
  }

  const listener = (changedKey: string, newValue: unknown): void => {
    if (changedKey === key) {
      callback(newValue as T);
    }
  };
  ensureMockListeners().add(listener);
  return () => {
    ensureMockListeners().delete(listener);
  };
}
