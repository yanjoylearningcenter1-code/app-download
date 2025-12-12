import { GoogleGenAI, Type } from "@google/genai";
import { WordSets } from "../types";

const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateWordSetsFromInput = async (
  textInput: string,
  imageFile: File | null
): Promise<WordSets> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  let prompt = `
    You are an expert Chinese language teacher specialized in Hong Kong Traditional Chinese education. 
    Analyze the input provided. It will be either a raw text string or an image containing Chinese text.
    
    Task:
    1. Identify all distinct Chinese words/phrases.
    2. **IMPORTANT**: Output must be in **Traditional Chinese (繁體中文)**. Convert any Simplified Chinese to Traditional.
    3. Sort them into three difficulty levels based on Hong Kong primary school standards:
       - Level A: Easy, Basic, Common daily words (1-2 characters, e.g., 蘋果, 學校).
       - Level B: Medium, Intermediate (2-3 characters, e.g., 圖書館, 蝴蝶).
       - Level C: Hard, Advanced, Idioms (Cheng Yu), or formal vocabulary (4 characters, e.g., 興高采烈).
    4. Ensure each level has at least 5 words. If the input is too short, generate relevant related words in Traditional Chinese to fill the list.
    5. Return ONLY a JSON object.
  `;

  const parts: any[] = [{ text: prompt }];

  if (textInput.trim()) {
    parts.push({ text: `Analyze this text: ${textInput}` });
  }

  if (imageFile) {
    const base64Data = await processImage(imageFile);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    });
  }

  // Schema definition for strictly typed JSON
  const schema = {
    type: Type.OBJECT,
    properties: {
      A: { type: Type.ARRAY, items: { type: Type.STRING } },
      B: { type: Type.ARRAY, items: { type: Type.STRING } },
      C: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["A", "B", "C"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a helpful assistant that processes educational content for Hong Kong students.",
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as WordSets;
      return data;
    } else {
      throw new Error("No data received from AI");
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to process content. Please try again.");
  }
};