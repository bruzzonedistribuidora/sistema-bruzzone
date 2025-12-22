// Funciones de soporte para que el sistema no falle al compilar
// Se pueden volver a conectar con la IA más adelante

export const generateResponse = async () => {
  return "Asistente desactivado temporalmente.";
};

// Función que pide Clients.tsx
export const fetchCompanyByCuit = async (cuit: string) => {
  console.log("Buscando CUIT:", cuit);
  return null;
};

// Función que pide POS.tsx
export const searchVirtualInventory = async (query: string) => {
  console.log("Buscando en inventario virtual:", query);
  return []; // Devolvemos una lista vacía para que el buscador no rompa
};
