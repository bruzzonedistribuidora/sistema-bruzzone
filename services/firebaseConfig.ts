// Added comment above the fix
// Using Firebase v8 compat style to resolve missing named exports (like initializeApp) in the environment
import firebase from "firebase/app";
import "firebase/firestore";

// Configuración oficial para el proyecto Ferretería Bruzzone
const firebaseConfig = {
  apiKey: "AIzaSyCzBPwTL4idkBKgDLVwOW3TlqjIpkZLULA",
  authDomain: "sistemagestionbruzzone.firebaseapp.com",
  projectId: "sistemagestionbruzzone",
  storageBucket: "sistemagestionbruzzone.firebasestorage.app",
  messagingSenderId: "569643821205",
  appId: "1:569643821205:web:72a6ba8eca5669c12f139c"
};

// Inicializamos la App
// Use compat check to avoid double initialization
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Inicializamos la Base de Datos (Firestore) y la exportamos como db
// Esto es vital para que syncService.ts reconozca la base de datos centralizada
export const db = app.firestore();
