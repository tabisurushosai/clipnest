export function getNextIndex(current: number, length: number): number {
  if (length <= 0) {
    return -1;
  }
  if (current < 0) {
    return 0;
  }
  if (current >= length - 1) {
    return length - 1;
  }
  return current + 1;
}

export function getPrevIndex(current: number, length: number): number {
  if (length <= 0) {
    return -1;
  }
  if (current <= 0) {
    return 0;
  }
  return current - 1;
}

export function focusClipAtIndex(listEl: HTMLElement, index: number): void {
  const items = listEl.querySelectorAll<HTMLElement>('.clip-item');
  items.forEach((item, i) => {
    item.classList.toggle('is-focused', i === index);
  });
  const target = items[index];
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: 'nearest' });
}

export type KeyboardHandlers = {
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
};

export function bindKeyboardNavigation(options: {
  listEl: HTMLElement;
  searchEl: HTMLInputElement | null;
  getItemCount: () => number;
  getClipIdAt: (index: number) => string | undefined;
  handlers: KeyboardHandlers;
}): void {
  let focusedIndex = -1;

  const resetFocus = (): void => {
    focusedIndex = -1;
    focusClipAtIndex(options.listEl, -1);
  };

  document.addEventListener('keydown', (event) => {
    if (
      options.searchEl &&
      document.activeElement === options.searchEl
    ) {
      return;
    }

    const count = options.getItemCount();
    if (count === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusedIndex = getNextIndex(focusedIndex, count);
      focusClipAtIndex(options.listEl, focusedIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusedIndex = getPrevIndex(focusedIndex, count);
      focusClipAtIndex(options.listEl, focusedIndex);
      return;
    }

    if (event.key === 'Enter' && focusedIndex >= 0) {
      event.preventDefault();
      const id = options.getClipIdAt(focusedIndex);
      if (id) {
        options.handlers.onCopy(id);
      }
      return;
    }

    if (event.key === 'Delete' && focusedIndex >= 0) {
      event.preventDefault();
      const id = options.getClipIdAt(focusedIndex);
      if (id) {
        options.handlers.onDelete(id);
      }
      return;
    }

    if ((event.key === 'p' || event.key === 'P') && focusedIndex >= 0) {
      event.preventDefault();
      const id = options.getClipIdAt(focusedIndex);
      if (id) {
        options.handlers.onTogglePin(id);
      }
    }
  });

  options.listEl.addEventListener('click', resetFocus);
}
