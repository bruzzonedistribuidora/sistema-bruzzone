
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeInvoice(imageBase64: string) {
  // Use ai.models.generateContent directly with model name and content as per guidelines
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: "Extract all items, totals, VAT, supplier info, and invoice number from this image. Format as JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          invoiceNumber: { type: Type.STRING },
          supplierName: { type: Type.STRING },
          supplierCuit: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
              }
            }
          },
          subtotal: { type: Type.NUMBER },
          iva: { type: Type.NUMBER },
          total: { type: Type.NUMBER }
        },
        required: ["invoiceNumber", "supplierName", "total"]
      }
    }
  });

  // Access text property directly (not as a method)
  return JSON.parse(response.text || "{}");
}