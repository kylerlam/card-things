import type { Collection } from './types';
import { validateCollection } from './validateCollection';

export interface CollectionSettingsDraft {
  title: string;
  description: string;
  categories: Collection['categories'];
}

export interface CollectionSettingsErrors {
  title?: string;
  description?: string;
  categories: Record<number, { label?: string; color?: string }>;
  form: string[];
}

export function createCollectionSettingsDraft(collection: Collection): CollectionSettingsDraft {
  return {
    title: collection.title,
    description: collection.description,
    categories: collection.categories.map((category) => ({ ...category })),
  };
}

export function createCategoryId(label: string, categories: Collection['categories']) {
  const base =
    label
      .normalize('NFKD')
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'category';
  const existingIds = new Set(['all', ...categories.map((category) => category.id)]);
  let id = base;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

export function normalizePickerColor(color: string) {
  if (/^#[\da-f]{6}$/i.test(color)) return color;
  if (/^#[\da-f]{3}$/i.test(color))
    return `#${color
      .slice(1)
      .split('')
      .map((character) => `${character}${character}`)
      .join('')}`;
  return '#3f6b58';
}

export function buildCollectionSettingsUpdate(
  collection: Collection,
  draft: CollectionSettingsDraft,
): { collection?: Collection; errors: CollectionSettingsErrors } {
  const next: Collection = {
    ...collection,
    title: draft.title.trim(),
    description: draft.description.trim(),
    example: false,
    categories: draft.categories.map((category) => ({
      ...category,
      label: category.label.trim(),
    })),
  };
  const errors: CollectionSettingsErrors = { categories: {}, form: [] };
  for (const error of validateCollection(next)) {
    const [path, ...messageParts] = error.split(': ');
    const message = messageParts.join(': ');
    if (path === 'title') errors.title = `Collection title ${message}`;
    else if (path === 'description') errors.description = `Collection description ${message}`;
    else {
      const category = path.match(/^categories\[(\d+)]\.(label|color)$/);
      if (category) {
        const index = Number(category[1]);
        const field = category[2] as 'label' | 'color';
        errors.categories[index] ||= {};
        errors.categories[index][field] =
          `${field === 'label' ? 'Category name' : 'Category color'} ${message}`;
      } else errors.form.push(error);
    }
  }
  const hasErrors =
    Boolean(errors.title || errors.description || errors.form.length) ||
    Object.keys(errors.categories).length > 0;
  return hasErrors ? { errors } : { collection: next, errors };
}
