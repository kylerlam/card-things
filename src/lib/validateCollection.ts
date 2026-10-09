import type { Collection } from './types.ts';

type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export function validateCollection(value: unknown): string[] {
  const errors: string[] = [];
  const check = (valid: boolean, path: string, message: string) => {
    if (!valid) errors.push(`${path}: ${message}`);
  };
  const textFields = (record: RecordValue, fields: string[], path: string) => {
    for (const field of fields)
      check(isText(record[field]), `${path}${field}`, 'must be a non-empty string');
  };
  if (!isRecord(value)) return ['collection: must be an object'];
  textFields(value, ['title', 'description'], '');
  check(typeof value.example === 'boolean', 'example', 'must be a boolean');
  check(Array.isArray(value.categories), 'categories', 'must be an array');
  check(Array.isArray(value.items), 'items', 'must be an array');

  const categories = new Set<string>();
  if (Array.isArray(value.categories))
    value.categories.forEach((category, index) => {
      const path = `categories[${index}]`;
      if (!isRecord(category)) {
        errors.push(`${path}: must be an object`);
        return;
      }
      check(
        isSlug(category.id) && category.id !== 'all',
        `${path}.id`,
        'must be a lowercase hyphenated ID other than "all"',
      );
      if (typeof category.id === 'string') {
        check(!categories.has(category.id), `${path}.id`, 'must be unique');
        categories.add(category.id);
      }
      textFields(category, ['label'], `${path}.`);
      check(
        typeof category.color === 'string' && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(category.color),
        `${path}.color`,
        'must be a three- or six-digit hex color',
      );
    });

  const ids = new Set<string>();
  if (Array.isArray(value.items))
    value.items.forEach((item, index) => {
      const path = `items[${index}]`;
      if (!isRecord(item)) {
        errors.push(`${path}: must be an object`);
        return;
      }
      check(isSlug(item.id), `${path}.id`, 'must be a lowercase hyphenated ID');
      if (typeof item.id === 'string') {
        check(!ids.has(item.id), `${path}.id`, 'must be unique');
        ids.add(item.id);
      }
      textFields(item, ['title', 'description', 'details'], `${path}.`);
      check(
        typeof item.category === 'string' && categories.has(item.category),
        `${path}.category`,
        'must reference an existing category ID',
      );
      const date =
        typeof item.added === 'string' ? new Date(`${item.added}T00:00:00Z`) : new Date(NaN);
      check(
        typeof item.added === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.added) &&
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === item.added,
        `${path}.added`,
        'must be a real calendar date in YYYY-MM-DD format',
      );
      if (!Array.isArray(item.tags)) errors.push(`${path}.tags: must be an array`);
      else {
        const tags = new Set<string>();
        item.tags.forEach((tag, tagIndex) => {
          check(isText(tag), `${path}.tags[${tagIndex}]`, 'must be a non-empty string');
          if (isText(tag)) {
            const normalized = tag.trim().toLowerCase();
            check(
              !tags.has(normalized),
              `${path}.tags[${tagIndex}]`,
              'must be unique within this item',
            );
            tags.add(normalized);
          }
        });
      }
      if (item.url !== undefined) {
        let valid = false;
        if (typeof item.url === 'string')
          try {
            const url = new URL(item.url);
            valid = ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
          } catch {
            /* Report the field without exposing its value. */
          }
        check(valid, `${path}.url`, 'must be an absolute HTTP(S) URL without embedded credentials');
      }
      if (item.image === undefined) return;
      if (!isRecord(item.image)) {
        errors.push(`${path}.image: must be an object`);
        return;
      }
      textFields(item.image, ['alt'], `${path}.image.`);
      check(
        typeof item.image.src === 'string' &&
          /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(item.image.src) &&
          !item.image.src.split('/').some((part) => !part || part === '.' || part === '..'),
        `${path}.image.src`,
        'must be a local path relative to public/, using letters, numbers, slashes, dots, hyphens, or underscores',
      );
      for (const field of ['position', 'size'] as const) {
        const css = item.image[field];
        if (css === undefined) continue;
        const token =
          field === 'position'
            ? '(?:left|right|top|bottom|center|\\d+(?:\\.\\d+)?(?:%|px))'
            : '(?:auto|\\d+(?:\\.\\d+)?(?:%|px))';
        const valid =
          typeof css === 'string' &&
          ((field === 'size' && ['cover', 'contain'].includes(css)) ||
            new RegExp(`^${token}(?: ${token})?$`).test(css));
        check(
          valid,
          `${path}.image.${field}`,
          'must contain supported CSS keywords, percentages, or pixel values',
        );
      }
    });
  return errors;
}

export function parseCollection(value: unknown): Collection {
  const errors = validateCollection(value);
  if (errors.length)
    throw new Error(`Invalid collection:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  return value as Collection;
}
