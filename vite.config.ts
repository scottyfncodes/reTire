import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * `base` is relative so the same build works at a GitHub Pages project path
 * (/reTire/), at a user-site root, or opened from disk.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
