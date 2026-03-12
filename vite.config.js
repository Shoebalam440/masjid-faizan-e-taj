import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png', 'mask-icon.svg', 'azan.mp3'],
      manifest: {
        name: 'Masjid Faizan e Taj',
        short_name: 'Faizan e Taj',
        description: 'Live Prayer Timings & Azaan Notifications for Masjid Faizan e Taj',
        theme_color: '#064E3B',
        background_color: '#022c22',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
