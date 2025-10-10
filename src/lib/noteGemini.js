/**
 * noteGemini.js
 * Gemini Free API integration for generating note content
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEYYYY; // 👈 matches your .env variable

if (!GEMINI_API_KEY) {
  console.error("⚠️ Gemini API key is missing. Add VITE_GEMINI_API_KEYYY to your .env file.");
}

/**
 * Generate content with Gemini
 * @param {string} prompt - user prompt for note generation
 * @returns {Promise<string>} generated markdown text
 */
export async function generateNoteWithGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a clean, well-structured markdown note for: ${prompt}.
                  Use headings (#, ##), bullet points, bold/italic formatting, and code blocks when relevant. and don't include markdown with triple ticks on the top  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    return "⚠️ No response from Gemini API";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "⚠️ Failed to generate note content";
  }
}
