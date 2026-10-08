import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import brandConfig from './src/content/brand.ts';
import { parseBrandConfig } from './src/lib/brandConfig.ts';
import { renderBrandHead, validateBrandAssets } from './scripts/brand-assets.ts';

const brand = parseBrandConfig(brandConfig);
validateBrandAssets(brand);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cardthings-brand',
      transformIndexHtml(html) {
        return html.replace('<!-- brand:head -->', renderBrandHead(brand));
      },
    },
  ],
  base: './',
});
