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
      includeAssets: ['favicon.svg', 'pwa-icon.jpg'],
      manifest: {
        name: 'Prestacontrol PWA',
        short_name: 'Prestacontrol',
        description: 'Sistema Administrativo para Préstamos Personales',
        theme_color: '#3D4D47',
        icons: [
          {
            src: 'pwa-icon.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'pwa-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: 'pwa-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
