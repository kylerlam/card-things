export const themeTokens = [
  'background',
  'surface',
  'text',
  'muted-text',
  'accent',
  'accent-hover',
  'on-accent',
  'border',
  'brand-mark',
  'brand-text',
  'heading',
  'focus-ring',
  'focus-border',
  'focus-shadow',
  'nav-label',
  'nav-hover',
  'nav-active',
  'count-text',
  'breadcrumb',
  'breadcrumb-muted',
  'status-text',
  'status-dot',
  'input-border',
  'input-icon',
  'placeholder',
  'key-border',
  'subtle-surface',
  'key-text',
  'key-shadow',
  'filter-text',
  'filter-hover',
  'sort-text',
  'card-border',
  'card-hover-border',
  'card-shadow',
  'cover-placeholder',
  'category-text',
  'tag-border',
  'tag-text',
  'icon-hover',
  'favorite-text',
  'footer-text',
  'empty-border',
  'empty-icon',
  'notice-text',
  'dialog-border',
  'dialog-shadow',
  'backdrop',
  'close-shadow',
  'detail-description',
  'detail-text',
  'copy-hover',
  'copy-shadow',
] as const;

export type ThemeToken = (typeof themeTokens)[number];
export type HexColor = `#${string}`;

export interface BrandConfig {
  name: string;
  tagline: string;
  footerNote: string;
  repositoryUrl: string;
  favicon: string;
  metadata: { title: string; description: string };
  theme: Record<ThemeToken, HexColor>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseBrandConfig(value: unknown): BrandConfig {
  const errors: string[] = [];
  function object(input: unknown, path: string, keys: readonly string[]) {
    if (!isRecord(input)) {
      errors.push(`${path}: must be an object`);
      return undefined;
    }
    for (const key of Object.keys(input)) {
      if (!keys.includes(key)) errors.push(`${path}.${key}: unknown field`);
    }
    return input;
  }
  function text(input: unknown, path: string) {
    if (typeof input !== 'string' || !input.trim())
      errors.push(`${path}: must be a non-empty string`);
  }
  const brand = object(value, 'brand', [
    'name',
    'tagline',
    'footerNote',
    'repositoryUrl',
    'favicon',
    'metadata',
    'theme',
  ]);
  if (brand) {
    for (const key of ['name', 'tagline', 'footerNote']) text(brand[key], `brand.${key}`);
    const metadata = object(brand.metadata, 'brand.metadata', ['title', 'description']);
    if (metadata)
      for (const key of ['title', 'description']) text(metadata[key], `brand.metadata.${key}`);
    let validUrl = false;
    if (typeof brand.repositoryUrl === 'string') {
      try {
        const url = new URL(brand.repositoryUrl);
        validUrl = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
      } catch {
        /* Report the field without exposing its value. */
      }
    }
    if (!validUrl)
      errors.push(
        'brand.repositoryUrl: must be an absolute HTTP(S) URL without embedded credentials',
      );
    if (
      typeof brand.favicon !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(?:svg|png|ico)$/.test(brand.favicon) ||
      brand.favicon.split('/').some((part) => !part || part === '.' || part === '..')
    )
      errors.push(
        'brand.favicon: must be a local SVG, PNG, or ICO path relative to public/ without traversal',
      );
    const theme = object(brand.theme, 'brand.theme', themeTokens);
    if (theme)
      for (const token of themeTokens) {
        if (
          typeof theme[token] !== 'string' ||
          !/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(theme[token])
        )
          errors.push(`brand.theme.${token}: must be a three-, six-, or eight-digit hex color`);
      }
  }
  if (errors.length)
    throw new Error(
      `Invalid brand configuration:\n${errors.map((error) => `- ${error}`).join('\n')}`,
    );
  return value as BrandConfig;
}
