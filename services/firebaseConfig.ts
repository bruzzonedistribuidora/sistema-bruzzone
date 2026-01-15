import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzBPwTL4idkBKgDLVwOW3TlqjIpkZLULA",
  authDomain: "sistemagestionbruzzone.firebaseapp.com",
  projectId: "sistemagestionbruzzone",
  storageBucket: "sistemagestionbruzzone.firebasestorage.app",
  messagingSenderId: "569643821205",
  appId: "1:569643821205:web:72a6ba8eca5669c12f139c"
};

// Evita errores de re-inicialización en entornos con Hot Module Replacement (Vite)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestore: Firestore = getFirestore(app);

// Exportación nominal explícita para compatibilidad total con Rollup
export { firestore as db };
