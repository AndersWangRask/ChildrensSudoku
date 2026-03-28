import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/free-fruit-sudoku-for-kids/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: 'Free Fruit Sudoku for Kids',
        short_name: 'Fruit Sudoku',
        description: 'A free fruit-themed Sudoku puzzle game for kids',
        theme_color: '#fef9c3',
        background_color: '#fef9c3',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/free-fruit-sudoku-for-kids/',
        start_url: '/free-fruit-sudoku-for-kids/',
        icons: [
          {
            src: '/free-fruit-sudoku-for-kids/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/free-fruit-sudoku-for-kids/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/free-fruit-sudoku-for-kids/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}']
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5191,
    strictPort: false,
    open: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
