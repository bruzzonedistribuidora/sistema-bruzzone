// ARCHIVO DE SOPORTE INTEGRAL (SIMULADO PARA DESPLIEGUE)
// Este archivo permite que todos los módulos (Ventas, Compras, Clientes) compilen bien.

export const askAssistant = async (message: string) => {
  return "El asistente de IA no está disponible en este momento.";
};

export const generateResponse = async (prompt: string) => {
  return "Respuesta automática: El sistema está en modo mantenimiento de IA.";
};

// Función que pide Purchases.tsx
export const analyzeInvoice = async (file: any) => {
  console.log("Simulando análisis de factura...");
  return null;
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

// Por si algún componente pide el modelo directamente
export const getGeminiModel = () => {
  return null;
};
