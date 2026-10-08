import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const content: Collection = JSON.parse(
  readFileSync(new URL('../src/content/collection.json', import.meta.url), 'utf8'),
);
import { parseCollection, validateCollection } from '../src/lib/validateCollection';
import type { Collection } from '../src/lib/types';

test('accepts the example collection, empty collections, and valid optional values', () => {
  expect(validateCollection(content)).toEqual([]);
  const example: Collection = structuredClone(content);
  example.items[0].added = '2024-02-29';
  example.items[0].url = 'https://example.com/resource';
  example.items[0].image.position = 'center top';
  example.items[0].image.size = 'cover';
  expect(parseCollection(example)).toEqual(example);
  expect(validateCollection({ ...example, categories: [], items: [] })).toEqual([]);
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
      data.items[0].image.src = '../private.png';
    },
    'items[0].image.src:',
  ],
  [
    'remote images',
    (data) => {
      data.items[0].image.src = 'https://example.com/image.png';
    },
    'items[0].image.src:',
  ],
  [
    'invalid image sizes',
    (data) => {
      data.items[0].image.size = 'url(external)';
    },
    'items[0].image.size:',
  ],
  [
    'empty image descriptions',
    (data) => {
      data.items[0].image.alt = '';
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
    data.items[0].image.src = 'images/missing-test-image.png';
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
