// Funciones de soporte para que el sistema no falle al compilar
export const generateResponse = async () => {
  return "Asistente desactivado temporalmente.";
};

export const fetchCompanyByCuit = async (cuit: string) => {
  console.log("Buscando CUIT:", cuit);
  return null;
};

export const searchVirtualInventory = async (query: string) => {
  console.log("Buscando en inventario virtual:", query);
  return [];
};
