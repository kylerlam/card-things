import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseCollection, validateCollection } from '../src/lib/validateCollection';
import { buildCardUpdate, createCardDraft } from '../src/lib/cardEditor';
import {
  buildCollectionSettingsUpdate,
  createCategoryId,
  createCollectionSettingsDraft,
  normalizePickerColor,
} from '../src/lib/collectionSettings';
import type { Collection } from '../src/lib/types';

// Negative cases must not depend on how many cards the user keeps in their collection.
const content: Collection = {
  title: 'Validation fixture',
  description: 'Independent data for schema checks.',
  example: true,
  categories: [
    { id: 'notes', label: 'Notes', color: '#234e70' },
    { id: 'resources', label: 'Resources', color: '#668b6b' },
  ],
  items: [1, 2].map((number) => ({
    id: `note-${number}`,
    title: `Note ${number}`,
    category: 'notes',
    description: 'A validation example.',
    details: 'Used only by the validation tests.',
    tags: ['Example'],
    added: '2026-10-08',
    image: { src: 'favicon.svg', alt: 'Two overlapping cards' },
  })),
};

test('accepts the current collection, empty collections, and valid optional values', () => {
  const current = JSON.parse(
    readFileSync(new URL('../src/content/collection.json', import.meta.url), 'utf8'),
  );
  expect(validateCollection(current)).toEqual([]);
  const example: Collection = structuredClone(content);
  example.items[0].added = '2024-02-29';
  example.items[0].url = 'https://example.com/resource';
  example.items[0].image!.position = 'center top';
  example.items[0].image!.size = 'cover';
  expect(parseCollection(example)).toEqual(example);
  delete example.items[0].image;
  expect(parseCollection(example)).toEqual(example);
  expect(validateCollection({ ...example, categories: [], items: [] })).toEqual([]);
});

test('builds a trimmed card with a unique stable ID and generated-cover default', () => {
  const draft = createCardDraft(content, undefined, new Date('2026-10-09T00:00:00Z'));
  Object.assign(draft, {
    title: ' Note 1 ',
    category: 'notes',
    description: ' A browser-created note. ',
    details: ' Useful context. ',
    tags: ' Research, Reference ',
  });
  const result = buildCardUpdate(content, draft);
  expect(result.errors).toEqual({});
  expect(result.item).toEqual({
    id: 'note-1-2',
    title: 'Note 1',
    category: 'notes',
    description: 'A browser-created note.',
    details: 'Useful context.',
    tags: ['Research', 'Reference'],
    added: '2026-10-09',
  });
  expect(result.collection?.example).toBe(false);
});

test('keeps an edited card ID and existing image art direction while reporting field errors', () => {
  const collection = structuredClone(content);
  collection.items[0].image!.position = 'left top';
  collection.items[0].image!.size = '600% 200%';
  const draft = createCardDraft(collection, collection.items[0]);
  draft.title = 'Edited note';
  const result = buildCardUpdate(collection, draft, collection.items[0].id);
  expect(result.item?.id).toBe('note-1');
  expect(result.item?.image).toEqual(collection.items[0].image);

  draft.url = 'javascript:alert(1)';
  draft.tags = 'same, Same';
  const invalid = buildCardUpdate(collection, draft, collection.items[0].id);
  expect(invalid.collection).toBeUndefined();
  expect(invalid.errors.url).toContain('absolute HTTP(S) URL');
  expect(invalid.errors.tags).toContain('unique within this item');
});

test('builds trimmed settings without changing category IDs or item references', () => {
  const draft = createCollectionSettingsDraft(content);
  draft.title = ' Portable shelf ';
  draft.description = ' Useful things kept nearby. ';
  draft.categories[0].label = 'Field notes';
  draft.categories[0].color = '#123456';
  const result = buildCollectionSettingsUpdate(content, draft);
  expect(result.errors).toEqual({ categories: {}, form: [] });
  expect(result.collection).toMatchObject({
    title: 'Portable shelf',
    description: 'Useful things kept nearby.',
    example: false,
  });
  expect(result.collection?.categories[0]).toEqual({
    id: 'notes',
    label: 'Field notes',
    color: '#123456',
  });
  expect(result.collection?.items[0]).toEqual(content.items[0]);
});

test('generates valid unique category IDs and normalizes picker colors', () => {
  expect(createCategoryId('Notes', content.categories)).toBe('notes-2');
  expect(createCategoryId('All', content.categories)).toBe('all-2');
  expect(createCategoryId('工具', content.categories)).toBe('category');
  expect(normalizePickerColor('#abc')).toBe('#aabbcc');
  expect(normalizePickerColor('invalid')).toBe('#3f6b58');
});

test('maps invalid collection settings back to their editable fields', () => {
  const draft = createCollectionSettingsDraft(content);
  draft.title = '';
  draft.description = '   ';
  draft.categories[0].label = '';
  draft.categories[1].color = 'red';
  const result = buildCollectionSettingsUpdate(content, draft);
  expect(result.collection).toBeUndefined();
  expect(result.errors.title).toContain('non-empty string');
  expect(result.errors.description).toContain('non-empty string');
  expect(result.errors.categories[0].label).toContain('non-empty string');
  expect(result.errors.categories[1].color).toContain('hex color');
  expect(result.errors.form).toEqual([]);
});

const cases: [string, (data: Collection) => void, string][] = [
  [
    'duplicate item IDs',
    (data) => {
      data.items[1].id = data.items[0].id;
    },
    'items[1].id: must be unique',
  ],
  [
    'duplicate category IDs',
    (data) => {
      data.categories[1].id = data.categories[0].id;
    },
    'categories[1].id: must be unique',
  ],
  [
    'reserved category IDs',
    (data) => {
      data.categories[0].id = 'all';
    },
    'categories[0].id:',
  ],
  [
    'unknown categories',
    (data) => {
      data.items[0].category = 'missing';
    },
    'items[0].category:',
  ],
  [
    'impossible dates',
    (data) => {
      data.items[0].added = '2026-02-30';
    },
    'items[0].added:',
  ],
  [
    'invalid dates',
    (data) => {
      data.items[0].added = 'not-a-date';
    },
    'items[0].added:',
  ],
  [
    'empty titles',
    (data) => {
      data.items[0].title = '  ';
    },
    'items[0].title:',
  ],
  [
    'duplicate tags',
    (data) => {
      data.items[0].tags = ['Design', ' design '];
    },
    'items[0].tags[1]:',
  ],
  [
    'unsafe links',
    (data) => {
      data.items[0].url = 'javascript:alert(1)';
    },
    'items[0].url:',
  ],
  [
    'links containing credentials',
    (data) => {
      data.items[0].url = 'https://user:private-value@example.com';
    },
    'items[0].url:',
  ],
  [
    'image traversal',
    (data) => {
      data.items[0].image!.src = '../private.png';
    },
    'items[0].image.src:',
  ],
  [
    'remote images',
    (data) => {
      data.items[0].image!.src = 'https://example.com/image.png';
    },
    'items[0].image.src:',
  ],
  [
    'invalid image sizes',
    (data) => {
      data.items[0].image!.size = 'url(external)';
    },
    'items[0].image.size:',
  ],
  [
    'empty image descriptions',
    (data) => {
      data.items[0].image!.alt = '';
    },
    'items[0].image.alt:',
  ],
  [
    'invalid colors',
    (data) => {
      data.categories[0].color = 'url(external)';
    },
    'categories[0].color:',
  ],
];
for (const [name, mutate, message] of cases) {
  test(`reports ${name} at the offending field`, () => {
    const data: Collection = structuredClone(content);
    mutate(data);
    expect(validateCollection(data).some((error) => error.startsWith(message))).toBe(true);
    expect(() => parseCollection(data)).toThrow('Invalid collection:');
    expect(validateCollection(data).join('\n')).not.toContain('private-value');
  });
}

test('reports malformed structures without crashing validation', () => {
  for (const value of [null, [], 4, 'invalid'])
    expect(validateCollection(value)).toEqual(['collection: must be an object']);
  expect(
    validateCollection({
      title: [],
      example: 'yes',
      categories: [null],
      items: [null, { image: null, tags: 4 }],
    }),
  ).toEqual(
    expect.arrayContaining([
      'title: must be a non-empty string',
      'example: must be a boolean',
      'categories[0]: must be an object',
      'items[0]: must be an object',
      'items[1].image: must be an object',
    ]),
  );
});

test('validation command rejects missing assets and malformed JSON with a failing exit code', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cardthings-content-'));
  const fixture = join(directory, 'collection.json');
  try {
    const data = structuredClone(content);
    data.items[0].image!.src = 'images/missing-test-image.png';
    writeFileSync(fixture, JSON.stringify(data));
    let result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', 'scripts/validate-content.ts', fixture],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Missing collection images:');
    writeFileSync(fixture, '{broken-json');
    result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', 'scripts/validate-content.ts', fixture],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).not.toContain('Collection valid');
  } finally {
    rmSync(directory, { recursive: true });
  }
});
