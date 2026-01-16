import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración oficial para el proyecto Ferretería Bruzzone
const firebaseConfig = {
  apiKey: "AIzaSyCzBPwTL4idkBKgDLVwOW3TlqjIpkZLULA",
  authDomain: "sistemagestionbruzzone.firebaseapp.com",
  projectId: "sistemagestionbruzzone",
  storageBucket: "sistemagestionbruzzone.firebasestorage.app",
  messagingSenderId: "569643821205",
  appId: "1:569643821205:web:72a6ba8eca5669c12f139c"
};

// Inicializamos la App (evitando duplicados en modo desarrollo)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializamos la Base de Datos (Firestore) y la exportamos como db
export const db = getFirestore(app);
