import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/** GitHub Pages project URL: https://onclal.github.io/idea-chartrons/ */
const GITHUB_PAGES_BASE = '/idea-chartrons/';
/** Vercel sert la SPA à la racine (`idea-chartrons.vercel.app/`). */
const base = process.env.VITE_BASE ?? (process.env.VERCEL ? '/' : GITHUB_PAGES_BASE);

export default defineConfig({
  base,
  define: {
    'process.env.INCLUDE_DEMO_DATA': JSON.stringify(
      process.env.INCLUDE_DEMO_DATA ?? process.env.VITE_INCLUDE_DEMO_DATA ?? '',
    ),
    'process.env.VITE_INCLUDE_DEMO_DATA': JSON.stringify(process.env.VITE_INCLUDE_DEMO_DATA ?? ''),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Temporarily unregister the SW so stale hashed CSS cannot be served.
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'images/quais-chartrons.jpg'],
      manifest: {
        name: 'IDÉA CHARTRONS',
        short_name: 'Chartrons',
        description: 'Plateforme hyper-locale pour le quartier des Chartrons à Bordeaux',
        theme_color: '#1F4D3A',
        background_color: '#F5F0E8',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: base,
        scope: base,
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
