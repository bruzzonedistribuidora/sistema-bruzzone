
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Credenciales de Firebase. 
// ATENCIÓN: Reemplazar con tus datos reales de la consola de Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAs-DEMO-KEY-REPLACE-ME",
  authDomain: "ferrogest-erp.firebaseapp.com",
  projectId: "ferrogest-erp",
  storageBucket: "ferrogest-erp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Updated condition to include "DEMO-KEY" string, for better warning detection
if (firebaseConfig.apiKey.includes("REPLACE-ME") || firebaseConfig.apiKey.includes("DEMO-KEY")) {
  console.warn("⚠️ ERROR DE CONFIGURACIÓN: Estás usando credenciales de demostración en lib/firebase.ts. La conexión a Firestore fallará hasta que pongas tus claves reales.");
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
    