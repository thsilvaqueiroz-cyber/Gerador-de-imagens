
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { VariationConfig } from "./types";

export const VARIATIONS: VariationConfig[] = [
  {
    label: "Fashion Editorial (Carão)",
    prompt: "High-fashion editorial style, fierce facial expression ('carão'), professional dramatic lighting, 8k resolution, ultra-realistic texture."
  },
  {
    label: "Natural & Lifestyle",
    prompt: "Candid lifestyle shot, natural smile, soft golden hour lighting, relaxed pose, ultra-realistic skin and fabric textures."
  },
  {
    label: "Dynamic Angle",
    prompt: "Low angle perspective, dynamic movement, high fashion pose, sharp focus on product details, cinematic atmosphere."
  },
  {
    label: "Studio Close-up",
    prompt: "Extreme close-up shot focusing on the product and the model's expression, soft bokeh background, flawless skin rendering, hyper-realistic."
  }
];

export async function generateFashionVariation(
  modelBase64: string,
  productBase64: string,
  variation: VariationConfig
): Promise<string> {
  // Re-instantiate to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelPart = {
    inlineData: {
      mimeType: 'image/png',
      data: modelBase64,
    },
  };
  
  const productPart = {
    inlineData: {
      mimeType: 'image/png',
      data: productBase64,
    },
  };

  const textPart = {
    text: `You are an expert fashion AI. I am providing two images. 
    Image 1: The model and the location/background context.
    Image 2: The specific product (clothing/accessory) to be worn.
    
    TASK: Generate an ultra-realistic 4K image of the EXACT same model from Image 1, in the EXACT same location/background, but now she is wearing/using the product from Image 2. 
    Maintain all physical characteristics of the model and the background environment. 
    Style instruction: ${variation.prompt}`
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [modelPart, productPart, textPart] },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: "4K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Não foi possível extrair a imagem da resposta da IA.");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }
}
