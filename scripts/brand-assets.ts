import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrandConfig } from '../src/lib/brandConfig.ts';

export function validateBrandAssets(brand: BrandConfig) {
  const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));
  try {
    if (statSync(resolve(publicDirectory, brand.favicon)).isFile()) return;
  } catch {
    /* Report the configuration field and expected local asset. */
  }
  throw new Error(`brand.favicon: missing file public/${brand.favicon}`);
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );

// These tags exist before JavaScript runs, in both development and built HTML.
export function renderBrandHead(brand: BrandConfig) {
  const css = Object.entries(brand.theme)
    .map(([key, value]) => `--${key}:${value}`)
    .join(';');
  return [
    `<meta name="theme-color" content="${brand.theme.accent}" />`,
    `<meta name="description" content="${escapeHtml(brand.metadata.description)}" />`,
    `<link rel="icon" href="./${escapeHtml(brand.favicon)}" />`,
    `<title>${escapeHtml(brand.metadata.title)}</title>`,
    `<style id="brand-theme">:root{${css}}</style>`,
  ].join('\n');
}
