import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/\.well-known\//],
      },
      manifest: {
        id: '/',
        name: 'RunIQ: Gig Offer Calculator',
        short_name: 'RunIQ',
        description: 'Scan or enter a delivery offer and see its real pay per hour and per mile after gas, before you accept.',
        start_url: '/',
        scope: '/',
        theme_color: '#0A0A0A',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['productivity', 'finance'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});
