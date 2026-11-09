
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/SCADAShield-Network-Planner/'

export default defineConfig({
  base,

  plugins: [
    react(),

    VitePWA({
      // Show an update notification instead of silently reloading
      registerType: 'prompt',
      injectRegister: false,

      // Use the manually maintained public manifest
      manifest: false,

      includeAssets: [
        'favicon.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
        'og-image.png'
      ],

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'
        ],

        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      },

      devOptions: {
        enabled: false
      }
    })
  ],

  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          flow: ['reactflow']
        }
      }
    }
  }
})
