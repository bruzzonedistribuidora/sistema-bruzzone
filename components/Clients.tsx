
import { GoogleGenAI, Type } from "@google/genai";
import { Product, CreditInstallment } from "../types";

declare var process: {
  env: {
    API_KEY: string;
  };
};

export const fetchLatestFinancingRates = async (platformName: string, targetUrl?: string): Promise<{installments: CreditInstallment[], sources: {title: string, uri: string}[]}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    let prompt = `Busca las tasas de interés vigentes para cobros con tarjeta en "${platformName}" Argentina (Planes 1, 3, 6, 12 cuotas).`;
    if (targetUrl) prompt += ` Prioriza esta URL: ${targetUrl}`;
    prompt += ` Devuelve JSON: [{ "installments": número, "surcharge": porcentaje, "label": "Descripción" }]`;

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
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({ title: String(chunk.web?.title || 'Fuente'), uri: String(chunk.web?.uri) })) || [];

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
        internalCodes: [r.sku], barcodes: [], providerCodes: [], isCombo: false, comboItems: [], vatRate: 21.0,
        listCost: r.price * 0.7, discounts: [0, 0, 0, 0], costAfterDiscounts: r.price * 0.7,
        profitMargin: 30, priceNeto: r.price / 1.21, priceFinal: r.price, stockDetails: []
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
    // Prompt más agresivo y específico para Argentina
    const prompt = `Realiza una búsqueda profunda en Google para encontrar los datos fiscales del CUIT: "${cuit}" en Argentina. 
    Busca en AFIP, CUITOnline, Dateas o el Boletín Oficial. 
    Identifica:
    1. Razón Social (Nombre legal completo).
    2. Domicilio Fiscal (Si no lo encuentras, pon "No informado").
    3. Condición de IVA (Debe ser: 'Responsable Inscripto', 'Monotributo', 'Exento' o 'Consumidor Final'). Si no estás seguro, pon 'Responsable Inscripto'.
    Devuelve estrictamente JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            razonSocial: { type: Type.STRING },
            domicilio: { type: Type.STRING },
            condicionIva: { 
                type: Type.STRING,
                description: "Debe ser uno de: 'Responsable Inscripto', 'Monotributo', 'Exento' o 'Consumidor Final'"
            }
          },
          required: ["razonSocial"] // Solo la razón social es obligatoria para no fallar si falta el resto
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    // Fix: Extract grounding sources from the AI response metadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({ title: String(chunk.web?.title || 'Fuente AFIP'), uri: String(chunk.web?.uri) })) || [];

    if (!result.razonSocial) return null;
    return { ...result, sources };
  } catch (error) { 
    console.error("Error fetching company by CUIT:", error);
    return null; 
  }
};
