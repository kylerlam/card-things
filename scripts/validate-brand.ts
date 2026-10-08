import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseBrandConfig } from '../src/lib/brandConfig.ts';
import { validateBrandAssets } from './brand-assets.ts';

const source =
  process.argv[2] || fileURLToPath(new URL('../src/content/brand.ts', import.meta.url));

try {
  const { default: config } = await import(pathToFileURL(resolve(source)).href);
  const brand = parseBrandConfig(config);
  validateBrandAssets(brand);
  console.log('Brand configuration valid.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Brand configuration validation failed.');
  process.exitCode = 1;
}
