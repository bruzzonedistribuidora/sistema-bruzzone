
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Marcamos como externas las librerías que se cargan vía CDN en el index.html
      // Esto evita que Rollup intente buscarlas o empaquetarlas durante el build.
      external: [
        'react',
        'react-dom',
        'lucide-react',
        '@google/genai',
        'recharts'
      ],
      output: {
        // Aseguramos que las importaciones se mantengan como rutas de módulos estándar
        // para que el navegador pueda resolverlas con el importmap.
        format: 'es'
      }
    }
  },
  server: {
    port: 3000
  }
});
