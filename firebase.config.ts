// firebase.config.ts
// Configuración de Firebase para Sistema Bruzzone

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2EuYZTDZHujlYnReaZcZGY9UZTcMFqXk",
  authDomain: "sistema-bruzzone.firebaseapp.com",
  projectId: "sistema-bruzzone",
  storageBucket: "sistema-bruzzone.firebasestorage.app",
  messagingSenderId: "786471905936",
  appId: "1:786471905936:web:72b53b652e205bfaa00615",
  measurementId: "G-XTW53QZ3EH"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
