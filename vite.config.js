import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? './' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons.svg'],
      manifest: {
        name: 'Farbenzauber Kids',
        short_name: 'Farbenzauber',
        lang: 'de-DE',
        start_url: './',
        display: 'standalone',
        background_color: '#fff7ed',
        theme_color: '#7c3aed',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webp,jpg,jpeg}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
}));
