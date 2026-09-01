import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Updates are coordinated by UpdatePrompt using version.json. This
      // avoids a waiting service-worker loop behind reverse proxies.
      selfDestroying: true,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Prestacontrol PWA',
        short_name: 'Prestacontrol',
        description: 'Sistema Administrativo para Préstamos Personales',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
