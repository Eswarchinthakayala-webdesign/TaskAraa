import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, count } = req.body;
  if (!topic || typeof topic !== "string") {
    return res.status(400).json({ error: "Topic is required" });
  }

  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

  try {
    const questions = await generateWithGemini(genAI, topic, count || 5);
    if (!questions || questions.length === 0) {
      const fallback = await fallbackOpenTrivia(count || 5);
      return res.status(200).json({ source: "triviadb", questions: fallback });
    }

    res.status(200).json({ source: "gemini", questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function generateWithGemini(genAI, topic, count) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Generate ${count} multiple choice quiz questions on "${topic}".
Return JSON array with: { "question": "...", "options": ["A", "B", "C", "D"], "answer": "B" }`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return tryParseJSON(text);
  } catch {
    return null;
  }
}

async function fallbackOpenTrivia(count) {
  const res = await fetch(`https://opentdb.com/api.php?amount=${count}&type=multiple&encode=url3986`);
  const data = await res.json();
  return data.results.map((q) => {
    const correct = decodeURIComponent(q.correct_answer);
    const incorrect = q.incorrect_answers.map((a) => decodeURIComponent(a));
    const options = [...incorrect, correct].sort(() => Math.random() - 0.5);
    return {
      question: decodeURIComponent(q.question),
      options,
      answer: correct,
    };
  });
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\[.*\]/s);
    return m ? JSON.parse(m[0]) : null;
  }
}
