import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Needed for GitHub Pages when served from a subpath
  base: '/credit-calculator-vibed/',
  plugins: [react()],
})
