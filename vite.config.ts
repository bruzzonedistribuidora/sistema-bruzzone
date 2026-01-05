import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Marcamos como externas las librerías que se cargan vía CDN en el index.html
      // Usamos strings exactos y expresiones regulares para capturar sub-rutas (como react/jsx-runtime)
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'lucide-react',
        '@google/genai',
        'recharts',
        /^react\/.*/,
        /^react-dom\/.*/,
      ],
    }
  },
  server: {
    port: 3000
  }
});
