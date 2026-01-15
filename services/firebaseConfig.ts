import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Configuración oficial de Firebase para el sistema de gestión.
 * Estos datos habilitan la sincronización en tiempo real entre terminales.
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
const db: Firestore = getFirestore(app);

export { db };
