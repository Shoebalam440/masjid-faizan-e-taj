import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'icon.png', 'apple-touch-icon.png', 'mask-icon.svg', 'azan.mp3'],
      manifest: {
        name: 'Masjid Faizan-E-Taj',
        short_name: 'Faizan-E-Taj',
        description: 'Live Prayer Timings & Azaan Notifications for Masjid Faizan e Taj',
        theme_color: '#064E3B',
        background_color: '#022c22',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
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
