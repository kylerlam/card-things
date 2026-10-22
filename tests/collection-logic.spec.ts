import { createFavoriteBackup, parseFavoriteBackup } from '../src/lib/favoriteBackup';
import { test, expect } from '@playwright/test';
import { collection, filterItems, safeItemUrl } from '../src/lib/collection';
import type { CollectionItem } from '../src/lib/types';

const items: CollectionItem[] = [
  {
    id: 'cafe-study',
    title: 'Café Étude',
    category: 'notes',
    description: 'Résumé sketches',
    details: 'A botanical notebook for quiet afternoons.',
    tags: ['Crème', 'Materials'],
    added: '2026-10-08',
    image: { src: 'favicon.svg', alt: 'An example notebook' },
  },
  {
    id: 'paper-study',
    title: 'Paper study',
    category: 'projects',
    description: 'Folded shapes',
    details: 'An exercise in form.',
    tags: ['Materials'],
    added: '2026-10-07',
    image: { src: 'favicon.svg', alt: 'Folded paper' },
  },
];

test('search ignores accents and case, including decomposed Unicode', () => {
  for (const query of ['cafe', 'CAFÉ', 'cafe\u0301', 'resume', 'CREME']) {
    expect(filterItems(items, query, 'all', [], false, 'recent').map((item) => item.id)).toEqual([
      'cafe-study',
    ]);
  }
});

test('search requires every whitespace-separated term across fields', () => {
  expect(
    filterItems(items, '  CAFE\tbotanical\nmaterials  ', 'all', [], false, 'recent').map(
      (item) => item.id,
    ),
  ).toEqual(['cafe-study']);
  expect(filterItems(items, 'cafe missing', 'all', [], false, 'recent')).toEqual([]);
  expect(filterItems(items, ' \t\n ', 'all', [], false, 'recent')).toHaveLength(2);
});

test('search includes configured category labels independently of category IDs', () => {
  const previous = collection.categories;
  collection.categories = [{ id: 'notes', label: 'Reading Journal', color: '#234e70' }];
  try {
    expect(
      filterItems(items, 'journal cafe', 'all', [], false, 'recent').map((item) => item.id),
    ).toEqual(['cafe-study']);
    expect(filterItems(items, 'notes', 'all', [], false, 'recent')).toHaveLength(1);
  } finally {
    collection.categories = previous;
  }
});

test('normalized search still composes with category and favorites filters', () => {
  expect(filterItems(items, 'resume', 'projects', ['cafe-study'], true, 'recent')).toEqual([]);
  expect(filterItems(items, 'resume', 'notes', ['paper-study'], true, 'recent')).toEqual([]);
  expect(
    filterItems(items, 'resume', 'notes', ['cafe-study'], true, 'recent').map((item) => item.id),
  ).toEqual(['cafe-study']);
});

test('tag filters match complete tags and compose with other constraints', () => {
  expect(filterItems(items, '', 'all', [], false, 'recent', 'Material')).toEqual([]);
  expect(
    filterItems(items, 'cafe', 'notes', ['cafe-study'], true, 'recent', 'Materials').map(
      (item) => item.id,
    ),
  ).toEqual(['cafe-study']);
  expect(filterItems(items, '', 'projects', [], false, 'recent', 'Crème')).toEqual([]);
});

test('all sort orders are deterministic without mutating the input', () => {
  const source = [
    items[1],
    { ...items[0], id: 'z-copy', title: items[1].title, added: items[1].added },
    items[0],
  ];
  const original = [...source];
  const sorted = (sort: string) =>
    filterItems(source, '', 'all', [], false, sort).map((item) => item.id);
  expect(sorted('title')).toEqual(['cafe-study', 'paper-study', 'z-copy']);
  expect(sorted('title-desc')).toEqual(['z-copy', 'paper-study', 'cafe-study']);
  expect(sorted('oldest')).toEqual(['paper-study', 'z-copy', 'cafe-study']);
  expect(sorted('recent')).toEqual(['cafe-study', 'paper-study', 'z-copy']);
  expect(source).toEqual(original);
});

test('favorites backups round-trip known IDs and deduplicate unknown or repeated entries', () => {
  const known = ['orbit-studio', 'quiet-spaces'];
  const text = createFavoriteBackup(['orbit-studio', 'orbit-studio', 'quiet-spaces']);
  expect(JSON.parse(text)).toEqual({ version: 1, favorites: known });
  expect(parseFavoriteBackup(text, known)).toEqual(known);
  expect(
    parseFavoriteBackup(
      JSON.stringify({ version: 1, favorites: ['gone', 'quiet-spaces', 'quiet-spaces'] }),
      known,
    ),
  ).toEqual(['quiet-spaces']);
  expect(parseFavoriteBackup(JSON.stringify({ version: 1, favorites: [] }), known)).toEqual([]);
});

test('invalid favorites backups fail instead of silently changing saved items', () => {
  for (const text of [
    '{bad-json',
    'null',
    '[]',
    '"backup"',
    '{}',
    '{"version":2,"favorites":[]}',
    '{"version":"1","favorites":[]}',
    '{"version":1,"favorites":"orbit-studio"}',
    '{"version":1,"favorites":["orbit-studio",3]}',
    '{"version":1,"favorites":[null]}',
  ])
    expect(() => parseFavoriteBackup(text, ['orbit-studio'])).toThrow();
});

test('resource links accept absolute HTTP(S) addresses without credentials', () => {
  expect(safeItemUrl('https://example.com/resource?q=notes#details')).toBe(
    'https://example.com/resource?q=notes#details',
  );
  expect(safeItemUrl('http://example.com')).toBe('http://example.com/');
});

test('resource links reject malformed, unsupported, or credential-bearing URLs', () => {
  for (const url of [
    undefined,
    '',
    '/relative',
    'not a URL',
    'javascript:alert(1)',
    'data:text/html,example',
    'https://user@example.com',
    'https://:password@example.com',
    'https://user:password@example.com',
    'https://%75ser:%70assword@example.com',
  ])
    expect(safeItemUrl(url)).toBeUndefined();
});
