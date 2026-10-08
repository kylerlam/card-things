import { defineConfig } from '@playwright/test';
import common from './playwright.config';

const baseURL = 'http://127.0.0.1:4175/collections/card-things/';

export default defineConfig({
  ...common,
  use: { ...common.use, baseURL },
  projects: common.projects
    ?.filter((project) => project.name !== 'content')
    .map((project) => ({
      ...project,
      testIgnore: ['**/content.spec.ts', '**/brand-config.spec.ts'],
    })),
  webServer: {
    command: 'npm run build && npm run preview:subpath',
    url: baseURL,
    reuseExistingServer: false,
  },
});
