import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'focusflow' to your GitHub repo name
  base: '/mypa/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
