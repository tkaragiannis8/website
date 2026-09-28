import { defineConfig } from 'astro/config';
export default defineConfig({
  site: process.env.SITE_URL || 'https://theodoroskaragiannis.com',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: {enabled:false},
  vite: { optimizeDeps: {exclude:['aria-query','axobject-query']} }
});
