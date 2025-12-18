
import { GoogleGenAI, Type } from "@google/genai";

// Declaración para permitir el uso de process.env en el navegador vía Vite
declare var process: any;

// Inicialización siguiendo estrictamente las guías: new GoogleGenAI({ apiKey: process.env.API_KEY })
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const searchVirtualInventory = async (query: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Genera una lista de 3 artículos de ferretería que coincidan con: "${query}". Responde solo en JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            price: { type: Type.NUMBER },
                            sku: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
}
