import { getAiUsage } from '../lib/ai_usage';
import { getSettings, updateSettings } from '../lib/db';
import { getLicense } from '../lib/license';

const aiToggle = document.querySelector<HTMLInputElement>('#ai-enabled');
const apiKeyInput = document.querySelector<HTMLInputElement>('#gemini-api-key');
const usageEl = document.querySelector<HTMLElement>('#ai-usage');
const tagManagerLink = document.querySelector<HTMLAnchorElement>('#tag-manager-link');
const templateManagerLink =
  document.querySelector<HTMLAnchorElement>('#template-manager-link');
const sectionButtons = document.querySelectorAll<HTMLButtonElement>('[data-section-target]');

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
  if (usageEl) {
    usageEl.textContent = String(usage);
  }
}

aiToggle?.addEventListener('change', () => {
  void updateSettings({ ai_enabled: aiToggle.checked }).then(refresh);
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
