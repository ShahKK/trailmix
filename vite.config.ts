import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base + HashRouter keeps the app working at any path
// (localhost, Netlify/Cloudflare root, or a GitHub Pages subpath).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trailmix — Resupply & Nutrition Planner',
        short_name: 'Trailmix',
        description:
          'Plan thru-hike food resupply and nutrition. Calories-per-ounce, shopping lists, mail drops — works offline on trail.',
        theme_color: '#16a34a',
        background_color: '#0b3d2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
        // The browser only ever requests the Latin subset for English text
        // (the CSS uses unicode-range), so keep the offline cache lean by not
        // precaching the other language subsets.
        globIgnores: [
          '**/inter-cyrillic*.woff2',
          '**/inter-greek*.woff2',
          '**/inter-vietnamese*.woff2',
          '**/inter-latin-ext*.woff2',
        ],
      },
    }),
  ],
})
