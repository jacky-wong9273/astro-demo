// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  integrations: [mdx()],
  // Directory output (about/index.html) works reliably with S3 static website hosting.
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
