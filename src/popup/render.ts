import type { Clip } from '../lib/types';

export type ClipListHandlers = {
  onCopy: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
};

export function sortClipsForDisplay(clips: Clip[]): Clip[] {
  return [...clips].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.created_at - a.created_at;
  });
}

export function truncatePreview(text: string, maxLength = 200): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

export function renderClipList(
  clips: Clip[],
  listEl: HTMLElement,
  handlers: ClipListHandlers,
): void {
  const sorted = sortClipsForDisplay(clips);
  listEl.replaceChildren();

  if (sorted.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'clip-empty';
    empty.textContent = 'No clips yet';
    listEl.append(empty);
    return;
  }

  for (const clip of sorted) {
    const item = document.createElement('li');
    item.className = `clip-item${clip.pinned ? ' is-pinned' : ''}`;
    item.dataset.clipId = clip.id;

    if (clip.source_favicon_url) {
      const favicon = document.createElement('img');
      favicon.className = 'clip-favicon';
      favicon.src = clip.source_favicon_url;
      favicon.alt = '';
      favicon.width = 16;
      favicon.height = 16;
      item.append(favicon);
    }

    const body = document.createElement('div');
    body.className = 'clip-body';

    const preview = document.createElement('p');
    preview.className = 'clip-preview';
    preview.textContent = truncatePreview(clip.preview || clip.content);

    const meta = document.createElement('p');
    meta.className = 'clip-meta';
    meta.textContent = clip.source_title || clip.source_url || 'Unknown source';

    body.append(preview, meta);
    item.append(body);

    const actions = document.createElement('div');
    actions.className = 'clip-actions';

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = 'pin';
    pinBtn.textContent = clip.pinned ? 'Unpin' : 'Pin';
    pinBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onTogglePin(clip.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete';
    deleteBtn.textContent = 'Del';
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onDelete(clip.id);
    });

    actions.append(pinBtn, deleteBtn);
    item.append(actions);

    item.addEventListener('click', () => {
      handlers.onCopy(clip.id);
    });

    listEl.append(item);
  }
}
