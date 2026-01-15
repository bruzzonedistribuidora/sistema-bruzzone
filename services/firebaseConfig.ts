import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Configuración oficial de Firebase para el sistema 'sistemagestionbruzzone'.
 * Se utiliza exportación directa para evitar errores de resolución en el build.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCzBPwTL4idkBKgDLVwOW3TlqjIpkZLULA",
  authDomain: "sistemagestionbruzzone.firebaseapp.com",
  projectId: "sistemagestionbruzzone",
  storageBucket: "sistemagestionbruzzone.firebasestorage.app",
  messagingSenderId: "569643821205",
  appId: "1:569643821205:web:72a6ba8eca5669c12f139c"
};

const app = initializeApp(firebaseConfig);

// Exportación directa para máxima compatibilidad con Vite/Rollup
export const db = getFirestore(app);
