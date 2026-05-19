import './popup.css';

import { sendMessage } from '../lib/messages';
import type { Clip } from '../lib/types';
import { renderClipList, type ClipListHandlers } from './render';
import { bindSearch, filterClips } from './search';
import { applyPopupTheme, watchSystemTheme } from './theme';
import { getItem, STORAGE_KEYS } from '../lib/storage';
import { isSettings } from '../lib/types';

const listEl = document.querySelector<HTMLUListElement>('#clip-list');
const errorEl = document.querySelector<HTMLElement>('#error');
const searchEl = document.querySelector<HTMLInputElement>('#search');
const toastEl = document.querySelector<HTMLElement>('#toast');

let allClips: Clip[] = [];

function showError(message: string): void {
  if (!errorEl) {
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function clearError(): void {
  if (!errorEl) {
    return;
  }
  errorEl.hidden = true;
  errorEl.textContent = '';
}

function showToast(message = 'Copied'): void {
  if (!toastEl) {
    return;
  }
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add('is-visible');
  globalThis.setTimeout(() => {
    toastEl.hidden = true;
    toastEl.classList.remove('is-visible');
  }, 1500);
}

function visibleClips(): Clip[] {
  return filterClips(allClips, searchEl?.value ?? '');
}

function refreshList(): void {
  if (!listEl) {
    return;
  }
  renderClipList(visibleClips(), listEl, handlers);
}

const handlers: ClipListHandlers = {
  onCopy: (id) => {
    void (async () => {
      try {
        const response = await sendMessage({ type: 'copy_clip', id });
        if (!response.ok) {
          showError(response.error);
          return;
        }
        const clip = allClips.find((item) => item.id === id);
        if (clip) {
          clip.use_count += 1;
        }
        clearError();
        refreshList();
        showToast('Copied');
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    })();
  },
  onTogglePin: (id) => {
    void (async () => {
      try {
        const response = await sendMessage({ type: 'toggle_pin', id });
        const index = allClips.findIndex((item) => item.id === id);
        if (index >= 0) {
          allClips[index] = response.clip;
        }
        clearError();
        refreshList();
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    })();
  },
  onDelete: (id) => {
    if (!globalThis.confirm('Delete this clip?')) {
      return;
    }
    void (async () => {
      try {
        await sendMessage({ type: 'delete_clip', id });
        allClips = allClips.filter((item) => item.id !== id);
        clearError();
        refreshList();
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    })();
  },
};

async function loadClips(): Promise<void> {
  const response = await sendMessage({ type: 'list_clips' });
  allClips = response.clips;
  refreshList();
}

async function bootstrap(): Promise<void> {
  if (!listEl) {
    return;
  }

  await applyPopupTheme();

  const raw = await getItem<unknown>(STORAGE_KEYS.settings, null);
  if (isSettings(raw) && raw.theme === 'auto') {
    watchSystemTheme(() => {
      void applyPopupTheme();
    });
  }

  if (searchEl) {
    bindSearch(searchEl, () => allClips, () => {
      refreshList();
    });
  }

  try {
    await loadClips();
    clearError();
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
}

void bootstrap();
