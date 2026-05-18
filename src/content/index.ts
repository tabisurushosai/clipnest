/* global document, location, Node, ClipboardEvent, HTMLInputElement, Element, URL */
import { sendMessage } from '../lib/messages';

const PREVIEW_MAX_LEN = 200;

function getFaviconUrl(): string {
  const link = document.querySelector('link[rel~="icon"]');
  const href = link?.getAttribute('href');
  if (href) {
    try {
      return new URL(href, document.baseURI).href;
    } catch {
      return href;
    }
  }
  try {
    return new URL('/favicon.ico', location.origin).href;
  } catch {
    return '/favicon.ico';
  }
}

function getPageTitle(): string {
  const title = document.title.trim();
  if (title) {
    return title;
  }
  return location.host;
}

function isPasswordCopy(event: ClipboardEvent): boolean {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === 'password') {
    return true;
  }

  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === 'password') {
    return true;
  }

  const selection = document.getSelection();
  const anchor = selection?.anchorNode;
  if (!anchor) {
    return false;
  }

  const element = anchor.nodeType === Node.ELEMENT_NODE ? (anchor as Element) : anchor.parentElement;
  return Boolean(element?.closest('input[type="password"]'));
}

function buildPreview(content: string): string {
  if (content.length <= PREVIEW_MAX_LEN) {
    return content;
  }
  return `${content.slice(0, PREVIEW_MAX_LEN)}…`;
}

function buildBasePayload() {
  return {
    source_url: location.href,
    source_title: getPageTitle(),
    source_favicon_url: getFaviconUrl(),
    tag_ids: [] as string[],
    ai_category: null,
    pinned: false,
  };
}

function onCopy(event: ClipboardEvent): void {
  if (isPasswordCopy(event)) {
    return;
  }

  const html = event.clipboardData?.getData('text/html')?.trim() ?? '';
  const base = buildBasePayload();

  if (html) {
    void sendMessage({
      type: 'save_clip',
      payload: {
        ...base,
        type: 'html',
        content: html,
        preview: '',
      },
    }).catch((error: unknown) => {
      globalThis.console.error('[clipnest] save_clip from content failed', error);
    });
    return;
  }

  const text = document.getSelection()?.toString() ?? '';
  if (text === '') {
    return;
  }

  void sendMessage({
    type: 'save_clip',
    payload: {
      ...base,
      type: 'text',
      content: text,
      preview: buildPreview(text),
    },
  }).catch((error: unknown) => {
    globalThis.console.error('[clipnest] save_clip from content failed', error);
  });
}

document.addEventListener('copy', onCopy, true);
