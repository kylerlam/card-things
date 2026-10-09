import type { Collection } from './types';

export const starterFilename = 'cardthings-starter.json';

export function createStarterCollection(date = new Date()): Collection {
  return {
    title: 'My Collection',
    description: 'A short introduction to the things worth keeping together.',
    example: false,
    categories: [{ id: 'ideas', label: 'Ideas', color: '#3f6b58' }],
    items: [
      {
        id: 'first-item',
        title: 'My first item',
        category: 'ideas',
        description: 'A short summary that appears on the collection card.',
        details: 'Add the useful details, context, or instructions you want to remember.',
        tags: ['Starter'],
        added: date.toISOString().slice(0, 10),
      },
    ],
  };
}
