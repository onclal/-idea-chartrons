import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/-idea-chartrons/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'IDÉA CHARTRONS',
        short_name: 'Chartrons',
        description: 'Plateforme hyper-locale pour le quartier des Chartrons à Bordeaux',
        theme_color: '#1F4D3A',
        background_color: '#F5F0E8',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/-idea-chartrons/',
        scope: '/-idea-chartrons/',
        lang: 'fr',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/-idea-chartrons/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:3001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z]+\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 220, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      enforce: 'post',
      closeBundle() {
        const dist = resolve(__dirname, 'dist');
        copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
