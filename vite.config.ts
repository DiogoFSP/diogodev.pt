import { copyFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// O GitHub Pages não conhece as rotas da SPA: um link direto para
// /projeto/deepsea devolveria a página 404 dele. Servindo o index.html
// como 404.html, o router recebe o URL e renderiza a página certa.
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
  // o site vive em diogofsp.github.io/Diogo.dev/,
  // por isso os caminhos dos assets têm de partir desta subpasta
  base: '/Diogo.dev/',
  plugins: [react(), spa404()],
})
