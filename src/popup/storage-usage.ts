export const DEFAULT_STORAGE_QUOTA_BYTES = 10 * 1024 * 1024;

export type StorageUsageLevel = 'normal' | 'warning' | 'error';

export function getStorageUsageLevel(percent: number): StorageUsageLevel {
  if (percent >= 95) {
    return 'error';
  }
  if (percent >= 80) {
    return 'warning';
  }
  return 'normal';
}

export async function readStorageUsage(): Promise<{ bytes: number; percent: number }> {
  const chromeApi = globalThis as {
    chrome?: {
      storage?: {
        local?: {
          getBytesInUse?: (keys: string | null) => Promise<number>;
          QUOTA_BYTES?: number;
        };
      };
    };
  };

  const local = chromeApi.chrome?.storage?.local;
  if (!local?.getBytesInUse) {
    return { bytes: 0, percent: 0 };
  }

  const bytes = await local.getBytesInUse(null);
  const quota = local.QUOTA_BYTES ?? DEFAULT_STORAGE_QUOTA_BYTES;
  const percent = quota > 0 ? (bytes / quota) * 100 : 0;
  return { bytes, percent };
}

export function updateStorageProgress(el: HTMLProgressElement, percent: number): void {
  const level = getStorageUsageLevel(percent);
  el.value = Math.min(100, Math.max(0, percent));
  el.classList.remove('warning', 'error');
  if (level === 'warning') {
    el.classList.add('warning');
  }
  if (level === 'error') {
    el.classList.add('error');
  }
}
