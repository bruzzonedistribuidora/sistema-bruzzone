import { GoogleGenAI, Type } from "@google/genai";
import { Product, CreditInstallment } from "../types";

const ai = new GoogleGenAI({ apiKey: (process as any).env.API_KEY });

export const fetchLatestFinancingRates = async (platformName: string, targetUrl?: string): Promise<{installments: CreditInstallment[], sources: {title: string, uri: string}[]}> => {
  try {
    const model = 'gemini-3-flash-preview';
    let prompt = `Busca las tasas de interés, recargos o coeficientes de financiación vigentes hoy para cobros con tarjeta de crédito en la plataforma "${platformName}" en Argentina. 
    Necesito que extraigas los recargos para los planes de 1, 3, 6, 9 y 12 cuotas (si existen). `;
    
    if (targetUrl) {
      prompt += `\nIMPORTANTE: Utiliza prioritariamente la información de esta URL específica: ${targetUrl}. Navega en ella y extrae los valores exactos publicados.`;
    }

    prompt += `\nDevuelve los datos exclusivamente en formato JSON siguiendo este esquema: 
    [{ "installments": número, "surcharge": porcentaje_decimal, "label": "Descripción" }]`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              installments: { type: Type.NUMBER },
              surcharge: { type: Type.NUMBER },
              label: { type: Type.STRING }
            },
            required: ["installments", "surcharge", "label"]
          }
        }
      }
    });

    const installments = JSON.parse(response.text || "[]");
    
    // Extraer fuentes asegurando que title y uri existan como strings
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({ 
        title: chunk.web!.title ?? "Fuente Web", 
        uri: chunk.web!.uri ?? "" 
      })) || [];

    return { 
      installments: installments.map((inst: any) => ({ ...inst, id: `ai-${Math.random()}` })),
      sources 
    };
  } catch (error) {
    console.error("Error fetching rates with AI:", error);
    throw error;
  }
};

export const searchVirtualInventory = async (query: string): Promise<Product[]> => {
  try {
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
        internalCodes: [r.sku], 
        barcodes: [],
        providerCodes: [],
        isCombo: false,
        comboItems: [],
        vatRate: 21.0,
        listCost: r.price * 0.7,
        discounts: [0, 0, 0, 0],
        costAfterDiscounts: r.price * 0.7,
        profitMargin: 30,
        priceNeto: r.price / 1.21,
        priceFinal: r.price,
        stockDetails: []
    }));
  } catch (error) {
    console.error("Error generating virtual inventory:", error);
    return [];
  }
};

export const askAssistant = async (history: string[], question: string): Promise<string> => {
    try {
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
};

export const analyzeInvoice = async (base64Data: string, mimeType: string): Promise<any> => {
  try {
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
