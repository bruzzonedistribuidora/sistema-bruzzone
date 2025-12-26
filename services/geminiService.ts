
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

export const searchVirtualInventory = async (query: string): Promise<Product[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const prompt = `Act as a database search engine for a massive hardware store (Ferretería).
    The user is searching for: "${query}".
    Generate 3 to 5 realistic product entries that would match this search.
    Include specific technical details. Return JSON array.`;

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
    const raw = JSON.parse(text);
    return raw.map((r: any) => ({
        ...r,
        internalCodes: [r.sku], // Map single SKU from IA to array
        barcodes: [],
        providerCodes: []
    }));
  } catch (error) {
    console.error("Error generating virtual inventory:", error);
    return [];
  }
};

export const classifyNewProduct = async (rawDescription: string): Promise<Partial<Product>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this raw product input for a hardware store and structure it: "${rawDescription}".`,
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
    const data = JSON.parse(text || '{}');
    return {
        ...data,
        internalCodes: data.sku ? [data.sku] : []
    };
  } catch (error) {
    console.error("Error classifying product:", error);
    return {};
  }
};

export const askAssistant = async (history: string[], question: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: "Eres 'FerreBot', un experto en ferretería y construcción. Sé breve, técnico y servicial."
            }
        });
        const response = await chat.sendMessage({ message: question });
        return response.text || "Lo siento, no pude procesar esa consulta.";
    } catch (error) {
        console.error("Error talking to assistant:", error);
        return "Error de conexión con el asistente.";
    }
}

export const analyzeInvoice = async (base64Data: string, mimeType: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Fix: gemini-2.5-flash-image does not support responseMimeType. 
    // Switched to gemini-3-flash-preview which supports multimodal input and JSON output.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data.split(',')[1] || base64Data, mimeType: mimeType } },
          { text: `Analiza esta factura de compra. Extrae CUIT, numero, fecha, items y total. JSON.` }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    throw error;
  }
};

export const fetchCompanyByCuit = async (cuit: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Simula datos AFIP para CUIT: "${cuit}".`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    return null;
  }
};
