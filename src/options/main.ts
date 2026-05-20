import { getAiUsage } from '../lib/ai_usage';
import { getSettings, updateSettings } from '../lib/db';
import { getLicense, type LicenseTier } from '../lib/license';
import type { Theme } from '../lib/types';

const aiToggle = document.querySelector<HTMLInputElement>('#ai-enabled');
const apiKeyInput = document.querySelector<HTMLInputElement>('#gemini-api-key');
const apiKeyVisibilityButton = document.querySelector<HTMLButtonElement>(
  '#toggle-api-key-visibility',
);
const aiAutoTitle = document.querySelector<HTMLInputElement>('#ai-auto-title');
const aiAutoCategory = document.querySelector<HTMLInputElement>('#ai-auto-category');
const aiAutoSummary = document.querySelector<HTMLInputElement>('#ai-auto-summary');
const usageEl = document.querySelector<HTMLElement>('#ai-usage');
const tagManagerLink = document.querySelector<HTMLAnchorElement>('#tag-manager-link');
const templateManagerLink =
  document.querySelector<HTMLAnchorElement>('#template-manager-link');
const sectionButtons = document.querySelectorAll<HTMLButtonElement>('[data-section-target]');
const toast = document.querySelector<HTMLElement>('#options-toast');

function showToast(message = 'Saved'): void {
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.hidden = false;
  globalThis.setTimeout(() => {
    toast.hidden = true;
  }, 1200);
}

function showSection(sectionId: string): void {
  document.querySelectorAll<HTMLElement>('.settings-section').forEach((section) => {
    section.hidden = section.id !== `section-${sectionId}`;
  });
}

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showSection(button.dataset.sectionTarget ?? 'general');
  });
});

async function refresh(): Promise<void> {
  const [settings, license, usage] = await Promise.all([
    getSettings(),
    getLicense(),
    getAiUsage(),
  ]);

  if (aiToggle) {
    aiToggle.checked = settings.ai_enabled;
    aiToggle.disabled = license.tier === 'free';
  }
  if (apiKeyInput) {
    apiKeyInput.value = settings.gemini_api_key ?? '';
  }
  if (aiAutoTitle) {
    aiAutoTitle.checked = settings.ai_auto_title;
  }
  if (aiAutoCategory) {
    aiAutoCategory.checked = settings.ai_auto_category;
  }
  if (aiAutoSummary) {
    aiAutoSummary.checked = settings.ai_auto_summary;
  }
  if (usageEl) {
    usageEl.textContent = String(usage);
  }
  document.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
    input.checked = input.value === settings.theme;
  });
  applyTierLocks(license.tier);
}

function applyTierLocks(tier: LicenseTier): void {
  document.querySelectorAll<HTMLButtonElement>('[data-premium-only]').forEach((button) => {
    button.disabled = tier === 'free';
  });
}

document.querySelectorAll<HTMLButtonElement>('[data-setting-max-clips]').forEach((button) => {
  button.addEventListener('click', () => {
    const maxClips = Number(button.dataset.settingMaxClips);
    void updateSettings({ max_clips: maxClips }).then(() => {
      showToast();
      return refresh();
    });
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-setting-retention-days]').forEach((button) => {
  button.addEventListener('click', () => {
    const retentionDays = Number(button.dataset.settingRetentionDays);
    void updateSettings({ retention_days: retentionDays }).then(() => {
      showToast();
      return refresh();
    });
  });
});

document.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
  input.addEventListener('change', () => {
    void updateSettings({ theme: input.value as Theme }).then(() => {
      showToast();
      return refresh();
    });
  });
});

aiToggle?.addEventListener('change', () => {
  void updateSettings({ ai_enabled: aiToggle.checked }).then(refresh);
});

aiAutoTitle?.addEventListener('change', () => {
  void updateSettings({ ai_auto_title: aiAutoTitle.checked }).then(refresh);
});

aiAutoCategory?.addEventListener('change', () => {
  void updateSettings({ ai_auto_category: aiAutoCategory.checked }).then(refresh);
});

aiAutoSummary?.addEventListener('change', () => {
  void updateSettings({ ai_auto_summary: aiAutoSummary.checked }).then(refresh);
});

apiKeyVisibilityButton?.addEventListener('click', () => {
  if (!apiKeyInput) {
    return;
  }
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  apiKeyVisibilityButton.textContent = apiKeyInput.type === 'password' ? 'Show' : 'Hide';
});

apiKeyInput?.addEventListener('change', () => {
  const value = apiKeyInput.value.trim();
  void updateSettings({ gemini_api_key: value || undefined }).then(refresh);
});

if (tagManagerLink) {
  tagManagerLink.href = 'tags.html';
}
if (templateManagerLink) {
  templateManagerLink.href = 'templates.html';
}

void refresh();
