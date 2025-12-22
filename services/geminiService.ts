
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

// Fix: Use direct process.env.API_KEY initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to simulate "Finding" products in a massive database using AI generation
export const searchVirtualInventory = async (query: string): Promise<Product[]> => {
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `Act as a database search engine for a massive hardware store (Ferretería).
    The user is searching for: "${query}".
    Generate 3 to 5 realistic product entries that would match this search.
    Include specific technical details typical of hardware (dimensions, material, brand).
    Return JSON array.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sku: { type: Type.STRING },
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              price: { type: Type.NUMBER },
              stock: { type: Type.INTEGER },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
            },
            required: ["id", "sku", "name", "category", "price", "stock", "description", "location"]
          }
        }
      }
    });

    const text = response.text?.trim();
    if (!text) return [];
    return JSON.parse(text) as Product[];
  } catch (error) {
    console.error("Error generating virtual inventory:", error);
    return [];
  }
};

export const fetchCompanyByCuit = async (cuit: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un asistente de administración fiscal. El usuario ingresó el CUIT: "${cuit}".
      Debes simular una consulta a la base de datos de AFIP/ARCA Argentina.
      INSTRUCCIÓN CRÍTICA: Si no conoces el CUIT exacto, INVENTA datos realistas y coherentes para una empresa o persona física argentina (Razón Social, domicilio en Argentina, teléfono con código de área, condición de IVA). 
      No digas que no puedes hacerlo. Genera siempre un resultado válido.
      Retorna solo JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Razón Social o Nombre Completo' },
            address: { type: Type.STRING, description: 'Dirección completa en Argentina' },
            phone: { type: Type.STRING, description: 'Teléfono con formato 11-xxxx-xxxx' },
            taxCondition: { type: Type.STRING, description: 'Condición ante el IVA' }
          },
          required: ["name", "address", "phone", "taxCondition"]
        }
      }
    });
    
    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching company data from AI:", error);
    return null;
  }
};

export const classifyNewProduct = async (rawDescription: string): Promise<Partial<Product>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this raw product input for a hardware store and structure it: "${rawDescription}".
      Assign a category, suggest a SKU format (XXX-000), estimate a market price in USD, and write a short technical description.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sku: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text?.trim();
    return JSON.parse(text || '{}');
  } catch (error) {
    console.error("Error classifying product:", error);
    return {};
  }
};

export const askAssistant = async (history: string[], question: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: "Eres 'FerreBot', un experto en ferretería y construcción con acceso a un catálogo de 140,000 artículos. Ayuda al usuario a encontrar herramientas, explica diferencias técnicas y asiste en procesos de facturación ARCA (Argentina). Sé breve, técnico y servicial."
            }
        });
        
        const response = await chat.sendMessage({ message: question });
        return response.text || "Lo siento, no pude procesar esa consulta.";
    } catch (error) {
        console.error("Error talking to assistant:", error);
        return "Error de conexión con el asistente.";
    }
}
