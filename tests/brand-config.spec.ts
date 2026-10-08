import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import brand from '../src/content/brand';
import { parseBrandConfig } from '../src/lib/brandConfig';
import { renderBrandHead } from '../scripts/brand-assets';

test('accepts the configured brand and escapes metadata as text', () => {
  expect(parseBrandConfig(brand)).toEqual(brand);
  const alternate = structuredClone(brand);
  alternate.metadata.title = 'Studio & Shelf <notes>';
  alternate.metadata.description = 'A "quoted" description <script>alert(1)</script>';
  const html = renderBrandHead(parseBrandConfig(alternate));
  expect(html).toContain('<title>Studio &amp; Shelf &lt;notes&gt;</title>');
  expect(html).toContain('&quot;quoted&quot;');
  expect(html).not.toContain('<script>');
});

const invalidCases: [string, unknown, string][] = [
  ['non-object', null, 'brand:'],
  ['empty name', { ...brand, name: ' ' }, 'brand.name:'],
  ['wrong text type', { ...brand, tagline: 42 }, 'brand.tagline:'],
  [
    'empty title',
    { ...brand, metadata: { ...brand.metadata, title: '' } },
    'brand.metadata.title:',
  ],
  ['missing metadata', { ...brand, metadata: undefined }, 'brand.metadata:'],
  ['unknown property', { ...brand, naem: 'Typo' }, 'brand.naem: unknown field'],
  ['missing colors', { ...brand, theme: {} }, 'brand.theme.accent:'],
  [
    'invalid color',
    { ...brand, theme: { ...brand.theme, accent: '#12gg56' } },
    'brand.theme.accent:',
  ],
  [
    'CSS injection',
    { ...brand, theme: { ...brand.theme, accent: 'red;}</style>' } },
    'brand.theme.accent:',
  ],
  [
    'unknown color',
    { ...brand, theme: { ...brand.theme, acccent: '#123456' } },
    'brand.theme.acccent: unknown field',
  ],
  [
    'unsafe repository URL',
    { ...brand, repositoryUrl: 'javascript:alert(1)' },
    'brand.repositoryUrl:',
  ],
  [
    'URL credentials',
    { ...brand, repositoryUrl: 'https://user:private-value@example.com/' },
    'brand.repositoryUrl:',
  ],
  ['remote favicon', { ...brand, favicon: 'https://example.com/icon.svg' }, 'brand.favicon:'],
  ['favicon traversal', { ...brand, favicon: '../icon.svg' }, 'brand.favicon:'],
];
for (const [name, value, path] of invalidCases) {
  test(`rejects ${name} with a useful field error`, () => {
    expect(() => parseBrandConfig(value)).toThrow(path);
    try {
      parseBrandConfig(value);
    } catch (error) {
      expect(String(error)).not.toContain('private-value');
    }
  });
}

test('the validation command fails for invalid config and missing favicon assets', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cardthings-brand-'));
  const source = join(directory, 'brand.mjs');
  try {
    for (const [value, message] of [
      [{ ...brand, name: '' }, 'brand.name:'],
      [{ ...brand, favicon: 'images/missing-brand-test.svg' }, 'brand.favicon: missing file'],
    ] as const) {
      writeFileSync(source, `export default ${JSON.stringify(value)};`);
      const result = spawnSync(
        process.execPath,
        ['--experimental-strip-types', 'scripts/validate-brand.ts', source],
        { encoding: 'utf8' },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(message);
      expect(result.stdout).not.toContain('Brand configuration valid.');
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
