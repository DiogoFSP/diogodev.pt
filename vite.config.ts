import { copyFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// fallback SPA no GitHub Pages: serve index.html como 404.html
// para links diretos às rotas funcionarem
function spa404(): Plugin {
  return {
    name: 'spa-404-github-pages',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), spa404()],
})
