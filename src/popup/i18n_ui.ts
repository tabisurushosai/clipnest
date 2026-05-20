import { getMessage } from '../lib/i18n';

export function applyPopupLocalizedStrings(): void {
  const searchEl = document.querySelector<HTMLInputElement>('#search');
  const clearSearchEl = document.querySelector<HTMLButtonElement>('#clear-search');
  const templatesButton = document.querySelector<HTMLButtonElement>('#templates-button');
  const noResults = document.querySelector<HTMLElement>('#no-results');
  const emptyState = document.querySelector<HTMLElement>('#empty-state');
  const premiumText = document.querySelector<HTMLElement>('#premium-modal-text');
  const shortcutTitle = document.querySelector<HTMLElement>('#shortcut-help-title');
  const shortcutBody = document.querySelector<HTMLElement>('#shortcut-help-body');

  if (searchEl) {
    searchEl.placeholder = getMessage('search_placeholder');
  }
  if (clearSearchEl) {
    clearSearchEl.setAttribute('aria-label', getMessage('clear_search'));
  }
  if (templatesButton) {
    templatesButton.textContent = getMessage('templates_button');
  }
  if (noResults) {
    noResults.textContent = getMessage('no_matches');
  }
  if (emptyState) {
    emptyState.textContent = getMessage('empty_state');
  }
  if (premiumText) {
    premiumText.textContent = getMessage('premium_required');
  }
  if (shortcutTitle) {
    shortcutTitle.textContent = getMessage('shortcut_help_title');
  }
  if (shortcutBody) {
    shortcutBody.textContent = getMessage('shortcut_help_body');
  }
}
