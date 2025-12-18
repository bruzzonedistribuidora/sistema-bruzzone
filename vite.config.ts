
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Declaración para evitar error TS2580/TS2307 sin @types/node
declare var process: any;

export default defineConfig(({ mode }) => {
  // Usamos process.cwd() global de Node.js para cargar el entorno
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
