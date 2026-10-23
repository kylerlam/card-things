import content from '../content/collection.json' with { type: 'json' };
import type { Collection, CollectionItem } from './types';

export const bundledCollection: Collection = content;

const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

export function filterItems(
  items: CollectionItem[],
  categories: Collection['categories'],
  query: string,
  category: string,
  favorites: string[],
  favoritesOnly: boolean,
  sort: string,
  tag = '',
) {
  const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      const categoryLabel = categories.find((entry) => entry.id === item.category)?.label;
      const searchable = normalizeSearch(
        [
          item.title,
          item.description,
          item.details,
          item.category,
          categoryLabel,
          ...item.tags,
        ].join(' '),
      );
      return (
        (category === 'all' || item.category === category) &&
        (!tag || item.tags.includes(tag)) &&
        (!favoritesOnly || favorites.includes(item.id)) &&
        terms.every((term) => searchable.includes(term))
      );
    })
    .sort((a, b) => {
      const byTitle = a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      if (sort === 'title') return byTitle;
      if (sort === 'title-desc') return -byTitle;
      const byDate = a.added.localeCompare(b.added);
      return (sort === 'oldest' ? byDate : -byDate) || byTitle;
    });
}

export function safeItemUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}
