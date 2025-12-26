// ARCHIVO DE SOPORTE LIMPIO (IA DESACTIVADA TEMPORALMENTE)
// Esto permite que el sistema de gestión funcione sin errores de librerías

// Función que pide Assistant.tsx
export const askAssistant = async (message: string) => {
  console.log("Mensaje al asistente:", message);
  return "El asistente de IA no está disponible en este momento.";
};

// Función genérica
export const generateResponse = async (prompt: string) => {
  return "Respuesta automática: El sistema está en mantenimiento.";
};

// Función que pide Clients.tsx
export const fetchCompanyByCuit = async (cuit: string) => {
  console.log("Buscando CUIT simulado:", cuit);
  return null;
};

// Función que pide POS.tsx
export const searchVirtualInventory = async (query: string) => {
  console.log("Buscando en inventario virtual simulado:", query);
  return [];
};
