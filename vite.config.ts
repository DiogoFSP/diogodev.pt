import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // o site vai viver em diogo2024152576.github.io/meu-portfolio/,
  // por isso os caminhos dos assets têm de partir desta subpasta
  base: '/meu-portfolio/',
  plugins: [react()],
})
