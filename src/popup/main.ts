import './popup.css';

import { translateClip } from '../lib/ai';
import { updateClip } from '../lib/db';
import { sendMessage } from '../lib/messages';
import { createTag, listTags } from '../lib/tags';
import { requirePremium } from '../lib/premium_gate';
import {
  fillTemplate,
  incrementUseCount as incrementTemplateUseCount,
  listTemplates,
} from '../lib/templates';
import type { Clip, Tag, Template } from '../lib/types';
import { isSettings } from '../lib/types';
import { getMessage } from '../lib/i18n';
import { getLicense } from '../lib/license';
import { getItem, STORAGE_KEYS } from '../lib/storage';
import { bindTrialBannerClick, updateTrialBanner } from './trial_banner';
import { updateDowngradeBanner } from './downgrade_banner';
import { applyPopupLocalizedStrings } from './i18n_ui';
import { updateClipCounterElement } from './counter';
import { filterClips, type ClipTypeFilter, type DateRangeFilter } from './filter';
import { bindKeyboardNavigation } from './keyboard';
import {
  DEFAULT_POPUP_STATE,
  loadPopupState,
  savePopupState,
  type PopupUiState,
} from './popup-state';
import { renderClipList, type ClipListHandlers } from './render';
import { readStorageUsage, updateStorageProgress } from './storage-usage';
import { sortClips, type SortMode } from './sort';
import { applyPopupTheme, watchSystemTheme } from './theme';

const listEl = document.querySelector<HTMLUListElement>('#clip-list');
const errorEl = document.querySelector<HTMLElement>('#error');
const searchEl = document.querySelector<HTMLInputElement>('#search');
const clearSearchEl = document.querySelector<HTMLButtonElement>('#clear-search');
const toastEl = document.querySelector<HTMLElement>('#toast');
const translateModal = document.querySelector<HTMLDialogElement>('#translate-modal');
const translateBody = document.querySelector<HTMLElement>('#translate-body');
const translateCopyBtn = document.querySelector<HTMLButtonElement>('#translate-copy');
const templatesButton = document.querySelector<HTMLButtonElement>('#templates-button');
const templatesModal = document.querySelector<HTMLDialogElement>('#templates-modal');
const templatePickerList = document.querySelector<HTMLElement>('#template-picker-list');
const templateVariableForm =
  document.querySelector<HTMLFormElement>('#template-variable-form');
const templateVariableTitle = document.querySelector<HTMLElement>('#template-variable-title');
const templateVariableFields = document.querySelector<HTMLElement>('#template-variable-fields');
const premiumModal = document.querySelector<HTMLDialogElement>('#premium-modal');
const trialBanner = document.querySelector<HTMLElement>('#trial-banner');
const downgradeBanner = document.querySelector<HTMLElement>('#downgrade-banner');
const shortcutHelpButton = document.querySelector<HTMLButtonElement>('#shortcut-help-button');
const shortcutHelpModal = document.querySelector<HTMLDialogElement>('#shortcut-help-modal');

let allClips: Clip[] = [];
let allTags: Tag[] = [];
let allTemplates: Template[] = [];
let selectedTemplate: Template | null = null;
let currentTier: 'free' | 'trial' | 'premium' = 'free';
let uiState: PopupUiState = { ...DEFAULT_POPUP_STATE };
let virtualPage = 0;
let virtualObserver: IntersectionObserver | null = null;

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

function showToast(message = getMessage('copied_toast')): void {
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

async function copyTemplate(template: Template, values: Record<string, string>): Promise<void> {
  const text = fillTemplate(template, values);
  await navigator.clipboard.writeText(text);
  await incrementTemplateUseCount(template.id);
  showToast('Copied template');
  templatesModal?.close();
}

function renderTemplateVariableForm(template: Template): void {
  selectedTemplate = template;
  if (!templateVariableForm || !templateVariableFields) {
    return;
  }
  if (template.variables.length === 0) {
    void copyTemplate(template, {});
    return;
  }
  templateVariableTitle!.textContent = template.title;
  templateVariableFields.replaceChildren(
    ...template.variables.map((variable) => {
      const label = document.createElement('label');
      label.textContent = variable;
      const input = document.createElement('input');
      input.name = variable;
      input.type = 'text';
      label.append(input);
      return label;
    }),
  );
  templateVariableForm.hidden = false;
}

function renderTemplatePicker(category = 'all'): void {
  if (!templatePickerList) {
    return;
  }
  const templates =
    category === 'all'
      ? allTemplates
      : allTemplates.filter((template) => template.category === category);
  templatePickerList.replaceChildren(
    ...templates.map((template) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'template-picker-item';
      button.textContent = `${template.title} (${template.category || 'Uncategorized'})`;
      button.addEventListener('click', () => {
        renderTemplateVariableForm(template);
      });
      return button;
    }),
  );
}

function renderTemplateCategoryFilter(): void {
  const container = document.querySelector<HTMLElement>('#template-category-filter');
  if (!container) {
    return;
  }
  const categories = ['all', ...new Set(allTemplates.map((template) => template.category))];
  container.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = category;
      button.addEventListener('click', () => {
        renderTemplatePicker(category);
      });
      return button;
    }),
  );
}

function visibleClips(): Clip[] {
  const filtered = filterClips(allClips, {
    query: uiState.query,
    type: uiState.type,
    dateRange: uiState.dateRange,
    tagIds: uiState.tagIds,
  });
  return sortClips(filtered, uiState.sort);
}

async function persistUiState(): Promise<void> {
  await savePopupState(uiState);
}

function updateListVisibility(filtered: Clip[]): void {
  const emptyState = document.querySelector<HTMLElement>('#empty-state');
  const noResults = document.querySelector<HTMLElement>('#no-results');
  const hasQuery = uiState.query.trim() !== '';
  const hasFilters =
    uiState.type !== 'all' ||
    uiState.dateRange !== 'all' ||
    uiState.tagIds.length > 0;
  const noMatches = filtered.length === 0 && (hasQuery || hasFilters);

  if (listEl) {
    listEl.hidden = allClips.length === 0 || noMatches;
  }
  if (emptyState) {
    emptyState.hidden = allClips.length !== 0;
  }
  if (noResults) {
    noResults.hidden = !noMatches || allClips.length === 0;
  }
}

function updateFooterCounter(): void {
  const counter = document.querySelector<HTMLElement>('#clip-counter');
  if (counter) {
    updateClipCounterElement(counter, allClips.length, currentTier);
  }
}

function syncFilterUi(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-type-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.typeFilter === uiState.type);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-date-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.dateFilter === uiState.dateRange);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.sort === uiState.sort);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-tag-id]').forEach((button) => {
    const tagId = button.dataset.tagId ?? '';
    button.classList.toggle('is-active', uiState.tagIds.includes(tagId));
  });
  if (searchEl) {
    searchEl.value = uiState.query;
  }
}

function setupVirtualObserver(): void {
  virtualObserver?.disconnect();
  const sentinel = document.querySelector('#virtual-sentinel');
  if (!sentinel || !listEl) {
    return;
  }
  virtualObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        virtualPage += 1;
        refreshList();
      }
    },
    { root: listEl.parentElement, threshold: 0.1 },
  );
  virtualObserver.observe(sentinel);
}

function refreshList(): void {
  if (!listEl) {
    return;
  }
  const filtered = visibleClips();
  updateListVisibility(filtered);
  renderClipList(filtered, listEl, handlers, {
    highlightQuery: uiState.query,
    tags: allTags,
    virtualPage,
  });
  setupVirtualObserver();
  updateFooterCounter();
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
        showToast();
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
        virtualPage = 0;
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
        virtualPage = 0;
        refreshList();
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    })();
  },
  onTagAdd: (clipId, tagId) => {
    void (async () => {
      const clip = allClips.find((item) => item.id === clipId);
      if (!clip || clip.tag_ids.includes(tagId)) {
        return;
      }
      const nextTags = [...clip.tag_ids, tagId];
      await updateClip(clipId, { tag_ids: nextTags });
      clip.tag_ids = nextTags;
      refreshList();
    })();
  },
  onTagCreate: (clipId, name, color) => {
    void (async () => {
      const tag = await createTag(name, color);
      allTags = await listTags();
      const clip = allClips.find((item) => item.id === clipId);
      if (clip) {
        const nextTags = [...clip.tag_ids, tag.id];
        await updateClip(clipId, { tag_ids: nextTags });
        clip.tag_ids = nextTags;
      }
      renderTagFilterChips();
      refreshList();
    })();
  },
  onTranslate: (clip, targetLang) => {
    void (async () => {
      const settings = await getItem<unknown>(STORAGE_KEYS.settings, null);
      if (!isSettings(settings) || !settings.gemini_api_key) {
        showError('Gemini API key is not configured');
        return;
      }
      try {
        if (!(await requirePremium('ai_translate'))) {
          premiumModal?.showModal();
          return;
        }
        const text = await translateClip(clip, targetLang, settings.gemini_api_key);
        if (translateBody) {
          translateBody.textContent = text;
        }
        if (translateModal) {
          translateModal.dataset.translation = text;
          translateModal.showModal();
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    })();
  },
};

function renderTagFilterChips(): void {
  const container = document.querySelector<HTMLElement>('#tag-filters');
  if (!container) {
    return;
  }
  container.replaceChildren();
  for (const tag of allTags) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip tag-chip-filter';
    button.dataset.tagId = tag.id;
    button.textContent = tag.name;
    button.style.borderColor = tag.color;
    button.classList.toggle('is-active', uiState.tagIds.includes(tag.id));
    button.addEventListener('click', () => {
      if (uiState.tagIds.includes(tag.id)) {
        uiState.tagIds = uiState.tagIds.filter((id) => id !== tag.id);
      } else {
        uiState.tagIds = [...uiState.tagIds, tag.id];
      }
      virtualPage = 0;
      void persistUiState();
      syncFilterUi();
      refreshList();
    });
    container.append(button);
  }
}

function bindToolbar(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-type-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.type = (button.dataset.typeFilter ?? 'all') as ClipTypeFilter;
      virtualPage = 0;
      void persistUiState();
      syncFilterUi();
      refreshList();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-date-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.dateRange = (button.dataset.dateFilter ?? 'all') as DateRangeFilter;
      virtualPage = 0;
      void persistUiState();
      syncFilterUi();
      refreshList();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.sort = (button.dataset.sort ?? 'pinned_first') as SortMode;
      virtualPage = 0;
      void persistUiState();
      syncFilterUi();
      refreshList();
    });
  });

  searchEl?.addEventListener('input', () => {
    uiState.query = searchEl.value;
    virtualPage = 0;
    void persistUiState();
    refreshList();
  });

  clearSearchEl?.addEventListener('click', () => {
    uiState.query = '';
    if (searchEl) {
      searchEl.value = '';
      searchEl.focus();
    }
    void persistUiState();
    refreshList();
  });

  searchEl?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      uiState.query = '';
      searchEl.value = '';
      void persistUiState();
      refreshList();
    }
  });
}

async function loadClips(): Promise<void> {
  const loading = document.querySelector<HTMLElement>('#loading');
  if (loading) {
    loading.hidden = false;
  }
  try {
    const response = await sendMessage({ type: 'list_clips' });
    allClips = response.clips;
    refreshList();
  } finally {
    if (loading) {
      loading.hidden = true;
    }
  }
}

function applyStatusBadge(tier: 'free' | 'trial' | 'premium'): void {
  const badge = document.querySelector<HTMLElement>('#status-badge');
  if (!badge) {
    return;
  }
  badge.textContent = tier.toUpperCase();
  badge.className = `tier-${tier}`;
}

async function bootstrap(): Promise<void> {
  if (!listEl) {
    return;
  }

  uiState = await loadPopupState();
  allTags = await listTags();
  renderTagFilterChips();
  syncFilterUi();

  applyPopupLocalizedStrings();

  const license = await getLicense();
  currentTier = license.tier;
  applyStatusBadge(license.tier);
  updateFooterCounter();
  updateTrialBanner(license, trialBanner);
  await updateDowngradeBanner(license, downgradeBanner);
  bindTrialBannerClick(trialBanner);

  const storageBar = document.querySelector<HTMLProgressElement>('#storage-usage');
  if (storageBar) {
    const usage = await readStorageUsage();
    updateStorageProgress(storageBar, usage.percent);
  }

  await applyPopupTheme();

  const raw = await getItem<unknown>(STORAGE_KEYS.settings, null);
  if (isSettings(raw) && raw.theme === 'auto') {
    watchSystemTheme(() => {
      void applyPopupTheme();
    });
  }

  bindToolbar();

  bindKeyboardNavigation({
    listEl,
    searchEl,
    getItemCount: () => listEl.querySelectorAll('.clip-item').length,
    getClipIdAt: (index) => {
      const item = listEl.querySelectorAll<HTMLElement>('.clip-item')[index];
      return item?.dataset.clipId;
    },
    handlers,
  });

  translateCopyBtn?.addEventListener('click', async () => {
    const text = translateModal?.dataset.translation ?? translateBody?.textContent ?? '';
    if (!text) {
      return;
    }
    await navigator.clipboard.writeText(text);
    showToast('Copied translation');
  });

  shortcutHelpButton?.addEventListener('click', () => {
    shortcutHelpModal?.showModal();
  });

  templatesButton?.addEventListener('click', async () => {
    allTemplates = await listTemplates();
    templateVariableForm?.setAttribute('hidden', '');
    renderTemplateCategoryFilter();
    renderTemplatePicker();
    templatesModal?.showModal();
  });

  templateVariableForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selectedTemplate || !templateVariableFields) {
      return;
    }
    const values = Object.fromEntries(
      [...templateVariableFields.querySelectorAll<HTMLInputElement>('input')].map((input) => [
        input.name,
        input.value,
      ]),
    );
    void copyTemplate(selectedTemplate, values);
  });

  try {
    await loadClips();
    clearError();
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
}

void bootstrap();
