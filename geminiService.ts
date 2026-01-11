
import { GoogleGenAI } from "@google/genai";
import { VariationConfig } from "./types";

export const VARIATIONS: VariationConfig[] = [
  {
    label: "Editorial Vogue",
    prompt: "High-end luxury fashion editorial, sharp focus, dramatic studio lighting, Vogue style, ultra-realistic skin and fabric textures, 8k rendering."
  },
  {
    label: "Street Lifestyle",
    prompt: "Professional street style photography, natural daylight, urban luxury background, candid aesthetic, hyper-realistic details."
  },
  {
    label: "Macro Detail",
    prompt: "Extreme close-up focusing on fabric texture and product quality, soft bokeh, professional fashion campaign lighting."
  },
  {
    label: "Cinematic Motion",
    prompt: "Cinematic wide shot, motion blur in background, high fashion pose, epic mood, masterwork quality rendering."
  }
];

export async function generateFashionImage(
  modelBase64: string,
  productBase64: string,
  variation: VariationConfig
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: modelBase64, mimeType: 'image/png' } },
        { inlineData: { data: productBase64, mimeType: 'image/png' } },
        { text: `TASK: Ultra-realistic 4K Fashion Generation.
          IMAGE 1: Reference for model and background.
          IMAGE 2: Reference for product/clothing.
          RESULT: The model from Image 1 wearing the product from Image 2 in the same setting.
          STYLE: ${variation.prompt}` }
      ]
    },
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
  
  throw new Error("Falha ao gerar imagem.");
}
