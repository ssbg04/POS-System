eimport { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

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
  preview:{
    allowedHosts: [
      'localhost',
      'pos-system-vl4d.onrender.com'
    ]
  }
})
