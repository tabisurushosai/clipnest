import { createTag, deleteTag, listTags, updateTag } from '../lib/tags';
import type { Tag } from '../lib/types';

export const TAG_COLOR_PRESETS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#64748B',
] as const;

const tagList = document.querySelector<HTMLUListElement>('#tag-list');
const createForm = document.querySelector<HTMLFormElement>('#create-form');
const nameInput = document.querySelector<HTMLInputElement>('#new-tag-name');
const colorPresets = document.querySelector<HTMLElement>('#color-presets');

let selectedColor: string = TAG_COLOR_PRESETS[0];

function renderColorPresets(): void {
  if (!colorPresets) {
    return;
  }
  colorPresets.replaceChildren();
  for (const color of TAG_COLOR_PRESETS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `color-chip${color === selectedColor ? ' is-selected' : ''}`;
    chip.style.backgroundColor = color;
    chip.title = color;
    chip.addEventListener('click', () => {
      selectedColor = color;
      renderColorPresets();
    });
    colorPresets.append(chip);
  }
}

function renderTagRow(tag: Tag): void {
  const li = document.createElement('li');
  li.className = 'tag-row';

  const preview = document.createElement('span');
  preview.className = 'tag-chip-preview';
  preview.style.backgroundColor = tag.color;
  preview.textContent = tag.name;

  const nameField = document.createElement('input');
  nameField.type = 'text';
  nameField.value = tag.name;
  nameField.addEventListener('change', () => {
    void updateTag(tag.id, { name: nameField.value.trim() }).then(render);
  });

  const colorRow = document.createElement('div');
  for (const color of TAG_COLOR_PRESETS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'color-chip';
    chip.style.backgroundColor = color;
    chip.addEventListener('click', () => {
      void updateTag(tag.id, { color }).then(render);
    });
    colorRow.append(chip);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => {
    if (globalThis.confirm(`Delete tag "${tag.name}"?`)) {
      void deleteTag(tag.id).then(render);
    }
  });

  li.append(preview, nameField, colorRow, deleteBtn);
  tagList?.append(li);
}

async function render(): Promise<void> {
  if (!tagList) {
    return;
  }
  tagList.replaceChildren();
  const tags = await listTags();
  for (const tag of tags) {
    renderTagRow(tag);
  }
}

createForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = nameInput?.value.trim();
  if (!name) {
    return;
  }
  void createTag(name, selectedColor).then(() => {
    if (nameInput) {
      nameInput.value = '';
    }
    return render();
  });
});

renderColorPresets();
void render();
