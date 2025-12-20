import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

// Fix: Use direct process.env.API_KEY initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to simulate "Finding" products in a massive database using AI generation
// This simulates fetching from the 140,000 articles if not found locally.
export const searchVirtualInventory = async (query: string): Promise<Product[]> => {
  try {
    // Fix: Select 'gemini-3-flash-preview' for basic text/data tasks
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

    // Fix: Access response.text property directly
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as Product[];
  } catch (error) {
    console.error("Error generating virtual inventory:", error);
    return [];
  }
};

export const classifyNewProduct = async (rawDescription: string): Promise<Partial<Product>> => {
  try {
    const response = await ai.models.generateContent({
      // Fix: Select recommended model for structured output tasks
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

    // Fix: Access response.text property directly
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error classifying product:", error);
    return {};
  }
};

export const askAssistant = async (history: string[], question: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            // Fix: Select recommended model for conversational tasks
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: "Eres 'FerreBot', un experto en ferretería y construcción con acceso a un catálogo de 140,000 artículos. Ayuda al usuario a encontrar herramientas, explica diferencias técnicas y asiste en procesos de facturación ARCA (Argentina). Sé breve, técnico y servicial."
            }
        });
        
        // In a real app, we would replay history. For now, we send the new message.
        const response = await chat.sendMessage({ message: question });
        // Fix: Access response.text property directly
        return response.text || "Lo siento, no pude procesar esa consulta.";
    } catch (error) {
        console.error("Error talking to assistant:", error);
        return "Error de conexión con el asistente.";
    }
}