import type { Clip, Tag } from '../lib/types';
import { highlightMatch } from './highlight';
import { shouldVirtualize, VIRTUAL_PAGE_SIZE, VIRTUAL_THRESHOLD } from './virtual';

export type ClipListHandlers = {
  onCopy: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onTagAdd?: (clipId: string, tagId: string) => void;
  onTagCreate?: (clipId: string, name: string, color: string) => void;
  onTranslate?: (clip: Clip, targetLang: string) => void;
};

export type RenderOptions = {
  highlightQuery?: string;
  tags?: Tag[];
  virtualPage?: number;
};

export function getRenderableClips(
  clips: Clip[],
  virtualPage = 0,
): { clips: Clip[]; virtualized: boolean; hasMore: boolean } {
  if (!shouldVirtualize(clips.length, VIRTUAL_THRESHOLD)) {
    return { clips, virtualized: false, hasMore: false };
  }
  const pagesToShow = virtualPage + 1;
  const visibleCount = Math.min(clips.length, pagesToShow * VIRTUAL_PAGE_SIZE);
  return {
    clips: clips.slice(0, visibleCount),
    virtualized: true,
    hasMore: visibleCount < clips.length,
  };
}

export function truncatePreview(text: string, maxLength = 200): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

function createTagControls(
  clip: Clip,
  tags: Tag[],
  handlers: ClipListHandlers,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'clip-tags';

  const select = document.createElement('select');
  select.className = 'tag-select';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Add tag…';
  select.append(placeholder);

  for (const tag of tags) {
    if (clip.tag_ids.includes(tag.id)) {
      continue;
    }
    const option = document.createElement('option');
    option.value = tag.id;
    option.textContent = tag.name;
    select.append(option);
  }

  select.addEventListener('change', () => {
    const tagId = select.value;
    if (!tagId) {
      return;
    }
    handlers.onTagAdd?.(clip.id, tagId);
    select.value = '';
  });

  const createBtn = document.createElement('button');
  createBtn.type = 'button';
  createBtn.className = 'tag-create';
  createBtn.textContent = 'New tag';
  createBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const name = globalThis.prompt('Tag name');
    if (!name?.trim()) {
      return;
    }
    handlers.onTagCreate?.(clip.id, name.trim(), '#3B82F6');
  });

  const chips = document.createElement('div');
  chips.className = 'clip-tag-chips';
  for (const tagId of clip.tag_ids) {
    const tag = tags.find((item) => item.id === tagId);
    if (!tag) {
      continue;
    }
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.style.backgroundColor = tag.color;
    chip.textContent = tag.name;
    chips.append(chip);
  }

  row.append(chips, select, createBtn);
  return row;
}

export function renderClipList(
  sortedClips: Clip[],
  listEl: HTMLElement,
  handlers: ClipListHandlers,
  options: RenderOptions = {},
): void {
  const virtualPage = options.virtualPage ?? 0;
  const { clips, virtualized, hasMore } = getRenderableClips(sortedClips, virtualPage);
  const highlightQuery = options.highlightQuery ?? '';
  const tags = options.tags ?? [];

  listEl.replaceChildren();

  if (clips.length === 0) {
    return;
  }

  for (const clip of clips) {
    const item = document.createElement('li');
    item.className = `clip-item${clip.pinned ? ' is-pinned' : ''}`;
    item.dataset.clipId = clip.id;
    item.tabIndex = 0;

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

    const title = document.createElement('p');
    title.className = 'clip-title';
    title.textContent = clip.ai_title || clip.source_title || 'Untitled';

    const preview = document.createElement('p');
    preview.className = 'clip-preview';
    const previewText = truncatePreview(clip.preview || clip.content);
    preview.innerHTML = highlightMatch(previewText, highlightQuery);

    const meta = document.createElement('p');
    meta.className = 'clip-meta';
    const metaParts = [clip.ai_category, clip.source_url || 'Unknown source'].filter(Boolean);
    meta.textContent = metaParts.join(' · ');

    if (clip.ai_summary) {
      const summary = document.createElement('p');
      summary.className = 'clip-summary';
      summary.textContent = clip.ai_summary;
      body.append(title, summary, preview, meta);
    } else {
      body.append(title, preview, meta);
    }

    const details = document.createElement('details');
    details.className = 'clip-details';
    const summaryEl = document.createElement('summary');
    summaryEl.textContent = 'Details';
    details.append(summaryEl, createTagControls(clip, tags, handlers));
    body.append(details);

    item.append(body);

    const actions = document.createElement('div');
    actions.className = 'clip-actions';

    const menu = document.createElement('details');
    menu.className = 'clip-menu';
    const menuSummary = document.createElement('summary');
    menuSummary.textContent = '⋯';
    const menuList = document.createElement('div');
    menuList.className = 'clip-menu-list';

    const translateJa = document.createElement('button');
    translateJa.type = 'button';
    translateJa.textContent = 'Translate to 日本語';
    translateJa.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onTranslate?.(clip, '日本語');
    });

    const translateEn = document.createElement('button');
    translateEn.type = 'button';
    translateEn.textContent = 'Translate to English';
    translateEn.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onTranslate?.(clip, 'English');
    });

    menuList.append(translateJa, translateEn);
    menu.append(menuSummary, menuList);

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

    actions.append(menu, pinBtn, deleteBtn);
    item.append(actions);

    item.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('details, button, select')) {
        return;
      }
      handlers.onCopy(clip.id);
    });

    listEl.append(item);
  }

  if (virtualized && hasMore) {
    const sentinel = document.createElement('li');
    sentinel.id = 'virtual-sentinel';
    sentinel.className = 'virtual-sentinel';
    sentinel.textContent = 'Loading more…';
    listEl.append(sentinel);
  }

  if (virtualized && !hasMore && sortedClips.length > VIRTUAL_THRESHOLD) {
    void totalPages(sortedClips.length);
  }
}
