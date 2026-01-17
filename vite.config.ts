
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Importamos el módulo path
import { fileURLToPath } from 'url'; // Import fileURLToPath

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      // Use import.meta.url for ESM compatibility
      '@components': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './components'),
    },
  },
});
