// src/lib/gemini.js
export async function generateQuiz(topic, count = 5, type) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = "gemini-2.0-flash-exp";

  const prompt = `
You are a quiz question generator.
Generate EXACTLY ${count} multiple-choice quiz questions on the topic: "${topic}" with difficulty: "${type}".

Output STRICTLY as a raw JSON array (no markdown, no explanations, no notes) in the following format:
[
  { "question": "string", "options": ["string","string","string","string"], "correctAnswer": "string" }
]

Rules:
- Each "options" array must contain exactly 4 unique strings.
- "correctAnswer" must exactly match one of the options.
- No extra keys, comments, numbering, or formatting outside the JSON array.
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${await res.text()}`);
    }

    const data = await res.json();
    
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up potential code fences or stray text
    rawText = rawText.replace(/```json|```/gi, "").trim();

    // More robust extraction: capture first valid JSON array in response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No valid JSON array found in Gemini response.");
    }

    rawText = jsonMatch[0];

    // Attempt parsing
    let questions;
    try {
      questions = JSON.parse(rawText);
    } catch (e) {
      // Handle trailing commas and malformed JSON
      rawText = rawText.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
      questions = JSON.parse(rawText);
    }

    // Validate final structure
    if (!Array.isArray(questions) || questions.length !== count) {
      throw new Error("Gemini output did not match expected format.");
    }

    for (const q of questions) {
      if (
        typeof q.question !== "string" ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctAnswer !== "string" ||
        !q.options.includes(q.correctAnswer)
      ) {
        throw new Error("Gemini output contains invalid question format.");
      }
    }

    return { source: "gemini", questions };

  } catch (err) {
    console.error("Gemini failed:", err);

    // Fallback to TriviaDB
    try {
      const triviaRes = await fetch(`https://opentdb.com/api.php?amount=${count}&type=multiple`);
      const triviaData = await triviaRes.json();

      const formattedQuestions = triviaData.results.map((q) => ({
        question: q.question,
        options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
        correctAnswer: q.correct_answer
      }));

      return { source: "triviadb", questions: formattedQuestions };
    } catch {
      throw new Error("Both Gemini and TriviaDB failed.");
    }
  }
}
