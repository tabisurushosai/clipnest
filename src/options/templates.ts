import { getLicense } from '../lib/license';
import {
  createTemplate,
  deleteTemplate,
  extractVariables,
  listTemplates,
  updateTemplate,
} from '../lib/templates';
import { TEMPLATE_CATEGORIES, type Template, type TemplateCategory } from '../lib/types';

const form = document.querySelector<HTMLFormElement>('#template-form');
const titleInput = document.querySelector<HTMLInputElement>('#template-title');
const categoryInput = document.querySelector<HTMLSelectElement>('#template-category');
const bodyInput = document.querySelector<HTMLTextAreaElement>('#template-body');
const variablePreview = document.querySelector<HTMLElement>('#variable-preview');
const templateList = document.querySelector<HTMLElement>('#template-list');
const limitText = document.querySelector<HTMLElement>('#template-limit');
const premiumModal = document.querySelector<HTMLDialogElement>('#premium-modal');

const FREE_TEMPLATE_LIMIT = 3;

let editingId: string | null = null;
let currentTemplates: Template[] = [];

function updateVariablePreview(): void {
  if (!variablePreview || !bodyInput) {
    return;
  }
  const variables = extractVariables(bodyInput.value);
  variablePreview.textContent = variables.length > 0 ? variables.join(', ') : 'None';
}

function renderCategoryOptions(): void {
  if (!categoryInput) {
    return;
  }
  categoryInput.replaceChildren(
    ...TEMPLATE_CATEGORIES.map((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      return option;
    }),
  );
}

function resetForm(): void {
  editingId = null;
  form?.reset();
  updateVariablePreview();
}

function renderRow(template: Template): HTMLElement {
  const row = document.createElement('article');
  row.className = 'template-row';

  const title = document.createElement('h2');
  title.textContent = template.title;

  const meta = document.createElement('p');
  meta.className = 'muted';
  meta.textContent = `${template.category || 'Uncategorized'} · used ${template.use_count}`;

  const body = document.createElement('pre');
  body.textContent = template.body;

  const variables = document.createElement('p');
  variables.className = 'muted';
  variables.textContent = `Variables: ${template.variables.join(', ') || 'None'}`;

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.textContent = 'Edit';
  edit.addEventListener('click', () => {
    editingId = template.id;
    if (titleInput) {
      titleInput.value = template.title;
    }
    if (categoryInput) {
      categoryInput.value = template.category;
    }
    if (bodyInput) {
      bodyInput.value = template.body;
    }
    updateVariablePreview();
  });

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Delete';
  remove.addEventListener('click', () => {
    if (globalThis.confirm(`Delete template "${template.title}"?`)) {
      void deleteTemplate(template.id).then(render);
    }
  });

  row.append(title, meta, body, variables, edit, remove);
  return row;
}

async function render(): Promise<void> {
  currentTemplates = await listTemplates();
  const license = await getLicense();
  if (limitText) {
    limitText.textContent =
      license.tier === 'free'
        ? `Free tier: ${currentTemplates.length} / ${FREE_TEMPLATE_LIMIT} templates`
        : 'Premium templates enabled';
  }
  templateList?.replaceChildren(...currentTemplates.map(renderRow));
}

bodyInput?.addEventListener('input', updateVariablePreview);

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = titleInput?.value.trim();
  const body = bodyInput?.value ?? '';
  if (!title || !body) {
    return;
  }

  void (async () => {
    const license = await getLicense();
    if (!editingId && license.tier === 'free' && currentTemplates.length >= FREE_TEMPLATE_LIMIT) {
      premiumModal?.showModal();
      return;
    }

    if (editingId) {
      await updateTemplate(editingId, {
        title,
        body,
        category: (categoryInput?.value || 'Uncategorized') as TemplateCategory,
      });
    } else {
      await createTemplate({
        title,
        body,
        category: (categoryInput?.value || 'Uncategorized') as TemplateCategory,
      });
    }
    resetForm();
    await render();
  })();
});

renderCategoryOptions();
updateVariablePreview();
void render();
