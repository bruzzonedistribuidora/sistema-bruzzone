// ARCHIVO DE SOPORTE LIMPIO (IA DESACTIVADA TEMPORALMENTE)
// Esto permite que el sistema de gestión funcione sin errores de librerías

export const generateResponse = async (prompt: string) => {
  console.log("IA en pausa:", prompt);
  return "El asistente de IA no está disponible en este momento.";
};

export const fetchCompanyByCuit = async (cuit: string) => {
  console.log("Buscando CUIT simulado:", cuit);
  return null;
};

export const searchVirtualInventory = async (query: string) => {
  console.log("Buscando en inventario virtual simulado:", query);
  return [];
};
