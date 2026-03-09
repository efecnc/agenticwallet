import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAIInstance) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

export function getGeminiModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: "gemini-2.5-flash" });
}
