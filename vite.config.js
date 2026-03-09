import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Caminhos relativos para funcionar com Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@styles': path.resolve(__dirname, './src/renderer/styles'),
    },
  },
  server: {
    port: 5173,
  },
});
