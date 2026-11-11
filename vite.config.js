import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Permite probar la PWA en entorno local
      },
      manifest: {
        name: 'Pick Me - Sistema de Trazabilidad',
        short_name: 'PickMe',
        description: 'Control de paquetes y depósito',
        theme_color: '#2c3e50',
        background_color: '#ffffff',
        display: 'standalone', // Obliga a la app a ocultar la barra del navegador
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})