// firebase.config.ts
// Configuración de Firebase para Sistema Bruzzone

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD2EuYZTDZHujlYnReaZcZGY9UZTcMFqXk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sistema-bruzzone.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sistema-bruzzone",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sistema-bruzzone.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "786471905936",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:786471905936:web:72b53b652e205bfaa00615",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XTW53QZ3EH"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
