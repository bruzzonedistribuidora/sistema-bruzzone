// @ts-ignore
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Configuración de la API usando la variable de entorno de Vite
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const searchVirtualInventory = async (query: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Act as a database search engine for a hardware store. User searches: "${query}". Return 3-5 realistic products as JSON array with id, sku, name, category, price, stock, description, location.`;
    const result = await model.generateContent(prompt);
    const raw = JSON.parse(result.response.text() || "[]");
    return raw.map((r: any) => ({ ...r, internalCodes: [r.sku], barcodes: [], providerCodes: [] }));
  } catch (e) { 
    console.error("Error en searchVirtualInventory:", e);
    return []; 
  }
};

export const classifyNewProduct = async (rawDescription: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(`Analyze and structure this hardware product: "${rawDescription}". Return JSON.`);
    const data = JSON.parse(result.response.text() || "{}");
    return { ...data, internalCodes: data.sku ? [data.sku] : [] };
  } catch (e) { 
    console.error("Error en classifyNewProduct:", e);
    return {}; 
  }
};

export const askAssistant = async (history: string[], question: string) => {
    try {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash", 
          systemInstruction: "Eres 'FerreBot', experto en ferretería y construcción. Sé breve, técnico y servicial." 
        });
        const chat = model.startChat({ 
          history: history.map(h => ({ role: 'user', parts: [{ text: h }] })) 
        });
        const result = await chat.sendMessage(question);
        return result.response.text() || "No pude procesar la respuesta.";
    } catch (e) { 
        console.error("Error en askAssistant:", e);
        return "Error de conexión con el asistente."; 
    }
};

export const analyzeInvoice = async (base64Data: string, mimeType: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const result = await model.generateContent([
      { inlineData: { data: cleanBase64, mimeType } }, 
      { text: "Analiza esta factura de compra. Extrae CUIT, numero, fecha, items y total. Responde estrictamente en formato JSON." }
    ]);
    return JSON.parse(result.response.text() || '{}');
  } catch (e) { 
    console.error("Error en analyzeInvoice:", e);
    throw e; 
  }
};

export const fetchCompanyByCuit = async (cuit: string) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      generationConfig: { responseMimeType: "application/json" } 
    });
    const result = await model.generateContent(`Simula datos AFIP para CUIT: "${cuit}". Retorna JSON con razonSocial, condicionIVA y domicilio.`);
    return JSON.parse(result.response.text() || '{}');
  } catch (e) { 
    console.error("Error en fetchCompanyByCuit:", e);
    return null; 
  }
};

export const fetchLatestFinancingRates = async () => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      generationConfig: { responseMimeType: "application/json" } 
    });
    const result = await model.generateContent("Genera tasas de financiación actuales para Argentina (3, 6, 12 cuotas) en JSON con campos cuotas3, cuotas6, cuotas12.");
    return JSON.parse(result.response.text() || '{}');
  } catch (e) {
    console.error("Error en fetchLatestFinancingRates:", e);
    return { cuotas3: 15, cuotas6: 30, cuotas12: 65 };
  }
};
