import { sendMessage } from '../lib/messages';
import { isClipboardUrl } from '../lib/url';

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

function isIgnoredCopyElement(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  if (element.hasAttribute('data-clipnest-ignore')) {
    return true;
  }
  return element instanceof HTMLInputElement && element.type === 'password';
}

function shouldSkipCopy(event: ClipboardEvent): boolean {
  const target = event.target;
  if (target instanceof Element && isIgnoredCopyElement(target)) {
    return true;
  }

  const active = document.activeElement;
  if (active instanceof Element && isIgnoredCopyElement(active)) {
    return true;
  }

  return false;
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

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('FileReader did not return a string'));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('FileReader failed'));
    };
    reader.readAsDataURL(file);
  });
}

async function findClipboardImageDataUrl(event: ClipboardEvent): Promise<string | null> {
  const items = event.clipboardData?.items;
  if (!items) {
    return null;
  }

  for (const item of items) {
    if (!item.type.startsWith('image/')) {
      continue;
    }
    const file = item.getAsFile();
    if (!file) {
      continue;
    }
    return readFileAsDataUrl(file);
  }

  return null;
}

async function handleCopy(event: ClipboardEvent): Promise<void> {
  if (shouldSkipCopy(event)) {
    return;
  }

  const base = buildBasePayload();

  try {
    const imageDataUrl = await findClipboardImageDataUrl(event);
    if (imageDataUrl) {
      await sendMessage({
        type: 'save_clip',
        payload: {
          ...base,
          type: 'image',
          content: imageDataUrl,
          preview: '',
        },
      });
      return;
    }
  } catch (error: unknown) {
    globalThis.console.error('[clipnest] image clipboard read failed', error);
  }

  const html = event.clipboardData?.getData('text/html')?.trim() ?? '';

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

  const clipType = isClipboardUrl(text) ? 'url' : 'text';

  void sendMessage({
    type: 'save_clip',
    payload: {
      ...base,
      type: clipType,
      content: text,
      preview: clipType === 'url' ? '' : buildPreview(text),
    },
  }).catch((error: unknown) => {
    globalThis.console.error('[clipnest] save_clip from content failed', error);
  });
}

function onCopy(event: ClipboardEvent): void {
  void handleCopy(event).catch((error: unknown) => {
    globalThis.console.error('[clipnest] copy handler failed', error);
  });
}

document.addEventListener('copy', onCopy, true);
