// src/lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEYYY);

export async function generateWithGemini({ sectionType, userInput, context }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
      Generate resume content for the section: ${sectionType}.
      Context: ${JSON.stringify(context)}
      User input: ${userInput || "N/A"}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return `⚠️ Could not generate ${sectionType}`;
  }
}
