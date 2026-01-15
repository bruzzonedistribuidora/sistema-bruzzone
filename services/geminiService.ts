import { GoogleGenAI, Type } from "@google/genai";
import { Product, CreditInstallment } from "../types";

export const fetchLatestFinancingRates = async (platformName: string, targetUrl?: string): Promise<{installments: CreditInstallment[], sources: {title: string, uri: string}[]}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    let prompt = `Busca las tasas de interés vigentes para cobros con tarjeta en "${platformName}" Argentina (Planes 1, 3, 6, 12 cuotas).`;
    if (targetUrl) prompt += ` Prioriza esta URL: ${targetUrl}`;

    // Fix: Remove responseMimeType and responseSchema when using googleSearch tool as per guidelines
    const searchResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const searchResultText = searchResponse.text || "";
    const sources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({ title: String(chunk.web?.title || 'Fuente'), uri: String(chunk.web?.uri) })) || [];

    // Fix: Perform a secondary call without search to safely format the grounded text into JSON
    const formatResponse = await ai.models.generateContent({
      model,
      contents: `Extrae las cuotas y recargos del siguiente texto y devuelve exclusivamente un JSON array con objetos { "installments": número, "surcharge": porcentaje, "label": "Descripción" }.\n\nTexto:\n${searchResultText}`,
      config: {
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

    const installments = JSON.parse(formatResponse.text || "[]");
    return { installments: installments.map((inst: any) => ({ ...inst, id: `ai-${Math.random()}` })), sources };
  } catch (error) {
    console.error("Error AI Rates:", error);
    throw error;
  }
};

export const analyzeInvoice = async (base64Data: string, mimeType: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data.split(',')[1] || base64Data,
              mimeType: mimeType
            }
          },
          { text: "Analiza esta factura de compra de ferretería. Extrae: CUIT emisor, nombre emisor, fecha, número factura, y una lista de items con: descripcion, cantidad, costo_unitario, bonificacion y subtotal. Devuelve exclusivamente JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cuitEmisor: { type: Type.STRING },
            nombreEmisor: { type: Type.STRING },
            numeroFactura: { type: Type.STRING },
            fecha: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  descripcion: { type: Type.STRING },
                  cantidad: { type: Type.NUMBER },
                  costoUnitario: { type: Type.NUMBER },
                  bonificacion: { type: Type.NUMBER },
                  subtotal: { type: Type.NUMBER }
                }
              }
            },
            total: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analizando factura:", error);
    throw error;
  }
};

export const searchVirtualInventory = async (query: string): Promise<Product[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const prompt = `Busca productos de ferretería para: "${query}". Genera 3-5 entradas realistas en JSON.`;

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

    const raw = JSON.parse(response.text || "[]");
    return raw.map((r: any) => ({
        ...r,
        id: r.id || `ai-${Math.random()}`,
        name: r.name || 'Producto IA',
        category: r.category || 'General',
        priceFinal: r.price || 0,
        stock: r.stock || 0,
        internalCodes: [r.sku || 'S/C'],
        barcodes: [],
        providerCodes: [],
        isCombo: false,
        comboItems: [],
        vatRate: 21.0,
        listCost: (r.price || 0) * 0.7,
        discounts: [0, 0, 0, 0],
        costAfterDiscounts: (r.price || 0) * 0.7,
        profitMargin: 30,
        priceNeto: (r.price || 0) / 1.21,
        stockDetails: [],
        ecommerce: { isPublished: true }
    }));
  } catch (error) { return []; }
};

export const askAssistant = async (history: string[], question: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction: "Eres 'FerreBot', experto en ferretería (140k artículos). Ayuda con stock, precios y técnica." }
        });
        const response = await chat.sendMessage({ message: question });
        return response.text || "No pude procesar la consulta.";
    } catch (error) { return "Error de conexión."; }
};

export const fetchCompanyByCuit = async (cuit: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    const prompt = `Realiza una búsqueda profunda en Google para encontrar los datos fiscales del CUIT: "${cuit}" en Argentina.`;

    // Fix: Remove responseMimeType and responseSchema when using googleSearch tool as per guidelines
    const searchResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }]
      }
    });

    const searchResultText = searchResponse.text || "";
    const sources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({ title: String(chunk.web?.title || 'Fuente'), uri: String(chunk.web?.uri) })) || [];

    // Fix: Perform a secondary call without search to safely format the grounded text into JSON
    const formatResponse = await ai.models.generateContent({
      model,
      contents: `Extrae los datos fiscales (razonSocial, domicilio, condicionIva) del siguiente texto y devuelve estrictamente JSON.\n\nTexto:\n${searchResultText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            razonSocial: { type: Type.STRING },
            domicilio: { type: Type.STRING },
            condicionIva: { type: Type.STRING }
          },
          required: ["razonSocial"]
        }
      }
    });

    const result = JSON.parse(formatResponse.text || '{}');
    if (!result.razonSocial) return null;
    return { ...result, sources };
  } catch (error) { 
    console.error("Error fetching company by CUIT:", error);
    return null; 
  }
};
