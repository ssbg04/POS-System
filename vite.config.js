import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    host: true,
    allowedHosts: ["pos-system-vl4d.onrender.com"],
  },
})
