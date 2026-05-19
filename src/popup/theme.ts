import { getItem, STORAGE_KEYS } from '../lib/storage';
import type { Settings, Theme } from '../lib/types';
import { isSettings } from '../lib/types';

const DEFAULT_SETTINGS: Pick<Settings, 'theme'> = { theme: 'auto' };

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export async function applyPopupTheme(): Promise<void> {
  const raw = await getItem<unknown>(STORAGE_KEYS.settings, null);
  const theme: Theme = isSettings(raw) ? raw.theme : DEFAULT_SETTINGS.theme;
  document.documentElement.dataset.theme = resolveTheme(theme);
}

export function watchSystemTheme(onChange: (resolved: 'light' | 'dark') => void): () => void {
  const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
  const listener = (): void => {
    onChange(media.matches ? 'dark' : 'light');
  };
  media.addEventListener('change', listener);
  return () => {
    media.removeEventListener('change', listener);
  };
}
