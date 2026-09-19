// Uses Google's official Gen AI SDK, which correctly handles Google's newer
// "auth key" (AQ.) format. A hand-rolled fetch() call does not reliably work
// with these newer keys, which is why this uses the library instead.
// Get a key at https://aistudio.google.com/apikey
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    const text = response?.text;
    if (!text) throw new Error("Empty response from Gemini");
    return text.trim();
  } catch (err) {
    console.error("Gemini API error:", err?.message || err);
    throw new Error(err?.message || "AI generation failed");
  }
}
