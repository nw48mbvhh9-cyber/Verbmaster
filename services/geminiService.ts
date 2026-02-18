
import { GoogleGenAI, Type } from "@google/genai";
import { Verb } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function fetchVerbList(count: number = 30): Promise<Verb[]> {
  const prompt = `Generate a list of ${count} essential English verbs including their V1 (Base), V2 (Past Simple), and V3 (Past Participle) forms. Also include a simple meaning for the V1 form and a short example sentence.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            v1: { type: Type.STRING },
            v2: { type: Type.STRING },
            v3: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ["v1", "v2", "v3", "meaning", "example"]
        }
      }
    }
  });

  try {
    const rawVerbs = JSON.parse(response.text);
    return rawVerbs.map((v: any, index: number) => ({
      ...v,
      id: `${Date.now()}-${index}`
    }));
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to load verbs. Please try again.");
  }
}
