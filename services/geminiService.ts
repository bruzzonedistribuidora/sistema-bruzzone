import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Product } from "../types";

// Inicializar la IA (el API_KEY debe ir directo o desde una variable de entorno segura)
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

export const searchVirtualInventory = async (query: string): Promise<Product[]> => {
  try {
    // Usamos gemini-1.5-flash que es rápido y soporta JSON Schema
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              sku: { type: SchemaType.STRING },
              name: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              price: { type: SchemaType.NUMBER },
              stock: { type: SchemaType.NUMBER },
              description: { type: SchemaType.STRING },
              location: { type: SchemaType.STRING },
            },
            required: ["id", "sku", "name", "category", "price", "stock", "description", "location"]
          }
        }
      }
    });

    const prompt = `Act as a database search engine for a massive hardware store (Ferretería).
    The user is searching for: "${query}".
    Generate 3 to 5 realistic product entries that would match this search.
    Include specific technical details.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text) return [];
    const raw = JSON.parse(text);

    return raw.map((r: any) => ({
        ...r,
        internalCodes: [r.sku],
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
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            sku: { type: SchemaType.STRING },
            name: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            price: { type: SchemaType.NUMBER },
            description: { type: SchemaType.STRING }
          }
        }
      }
    });

    const prompt = `Analyze this raw product input for a hardware store and structure it: "${rawDescription}".`;
    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text() || '{}');

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
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Eres 'FerreBot', un experto en ferretería y construcción. Sé breve, técnico y servicial."
        });

        const chat = model.startChat({
            history: history.map(h => ({ role: 'user', parts: [{ text: h }] })),
        });

        const result = await chat.sendMessage(question);
        return result.response.text() || "Lo siento, no pude procesar esa consulta.";
    } catch (error) {
        console.error("Error talking to assistant:", error);
        return "Error de conexión con el asistente.";
    }
}

export const analyzeInvoice = async (base64Data: string, mimeType: string): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Limpiar el base64 si viene con el prefijo data:image/...
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const result = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      },
      { text: "Analiza esta factura de compra. Extrae CUIT, numero, fecha, items y total. Responde estrictamente en formato JSON." }
    ]);

    return JSON.parse(result.response.text() || '{}');
  } catch (error) {
    console.error("Error analyzing invoice:", error);
    throw error;
  }
};

export const fetchCompanyByCuit = async (cuit: string): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(`Simula datos AFIP para CUIT: "${cuit}". Retorna JSON con razonSocial, condicionIVA y domicilio.`);
    return JSON.parse(result.response.text() || '{}');
  } catch (error) {
    return null;
  }
};