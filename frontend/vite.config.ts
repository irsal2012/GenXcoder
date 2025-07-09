import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer'
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': '"v18.0.0"',
    'process.platform': '"browser"'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'buffer', 'util']
  }
})
