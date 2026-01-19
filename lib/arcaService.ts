
import { Client, Supplier } from '../types';

// Mock ARCA_API_KEY for demonstration. In a real app, this would be secured.
const ARCA_API_KEY = process.env.ARCA_API_KEY || "YOUR_ARCA_DEMO_KEY"; 

interface ArcaClientData {
  name: string;
  cuit: string;
  email: string;
  phone: string; // WhatsApp can be derived from phone
  address?: string;
  ivaCondition?: string;
}

interface ArcaSupplierData {
  name: string;
  cuit: string;
  email: string;
  phone: string;
  address?: string;
}

/**
 * Simulates fetching data from an ARCA-like service based on CUIT.
 * In a real-world scenario, this would typically involve:
 * 1. An API call to your backend.
 * 2. Your backend communicating with AFIP/ARCA using secure credentials.
 * 3. Your backend returning the processed data to the frontend.
 * 
 * For this exercise, we simulate the API call directly.
 * @param cuit The CUIT to search for.
 * @param type 'client' or 'supplier' to determine the type of data to return.
 * @returns A Promise resolving with the ARCA data or rejecting with an error.
 */
export async function fetchArcaDataByCuit(cuit: string, type: 'client' | 'supplier'): Promise<ArcaClientData | ArcaSupplierData> {
  // Fix: Corrected setTimeout arguments to use resolve as the handler and the delay as the timeout.
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500)); // 0.5 to 2 seconds

  // Fix: Updated condition to explicitly check for "DEMO_KEY"
  if (!ARCA_API_KEY || ARCA_API_KEY.includes("DEMO_KEY") || ARCA_API_KEY.includes("REPLACE-ME")) {
    console.warn("ARCA Service: Using a demo API key. Replace with a real one for production.");
  }

  // Mock data based on CUIT and type
  const mockData: { [cuit: string]: { client?: ArcaClientData, supplier?: ArcaSupplierData } } = {
    '20-33445566-7': {
      client: {
        name: 'Juan Perez S.R.L.',
        cuit: '20-33445566-7',
        email: 'contacto@juanperez.com',
        phone: '5491155551234',
        address: 'Calle Falsa 123',
        ivaCondition: 'Responsable Inscripto',
      }
    },
    '30-11223344-9': {
      client: {
        name: 'Constructora del Norte S.A.',
        cuit: '30-11223344-9',
        email: 'info@cdn.com.ar',
        phone: '5491144445678',
        address: 'Av. Libertador 789',
        ivaCondition: 'Responsable Inscripto',
      },
      supplier: {
        name: 'Constructora del Norte S.A.',
        cuit: '30-11223344-9',
        email: 'compras@cdn.com.ar',
        phone: '5491144445678',
        address: 'Av. Libertador 789',
      }
    },
    '30-50001234-5': {
      supplier: {
        name: 'Sinteplast S.A.',
        cuit: '30-50001234-5',
        email: 'ventas@sinteplast.com.ar',
        phone: '5491133339876',
        address: 'Ruta 3 Km 50',
      }
    },
    // Add more mock CUITs as needed
  };

  const data = mockData[cuit];

  if (data && data[type]) {
    return data[type]!;
  } else {
    throw new Error(`CUIT '${cuit}' no encontrado en ARCA para tipo '${type}'.`);
  }
}
    