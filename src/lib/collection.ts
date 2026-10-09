import content from '../content/collection.json';
import type { Collection, CollectionItem } from './types';

export const bundledCollection: Collection = content;

export function filterItems(
  items: CollectionItem[],
  categories: Collection['categories'],
  query: string,
  category: string,
  favorites: string[],
  favoritesOnly: boolean,
  sort: string,
) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      const categoryLabel = categories.find((entry) => entry.id === item.category)?.label || '';
      const searchable = [
        item.title,
        item.description,
        item.details,
        item.category,
        categoryLabel,
        ...item.tags,
      ]
        .join(' ')
        .toLocaleLowerCase();
      return (
        (category === 'all' || item.category === category) &&
        (!favoritesOnly || favorites.includes(item.id)) &&
        terms.every((term) => searchable.includes(term))
      );
    })
    .sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : b.added.localeCompare(a.added),
    );
}

export function safeItemUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
