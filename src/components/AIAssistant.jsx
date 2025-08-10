import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Copy, Check } from "lucide-react";

// Init Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function AIAssistant({ onSave }) {
  const [prompt, setPrompt] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMarkdown = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(
        `Generate a concise GitHub-style markdown note with code snippets (if applicable) for: ${prompt}`
      );
      const text = result.response.text();
      setMarkdown(text);
    } catch (err) {
      console.error(err);
      setMarkdown("⚠️ Error generating note.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#151526] border border-purple-600 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-purple-300">
        🤖 AI Note Assistant
      </h2>

      {/* Prompt Input */}
      <textarea
        className="w-full p-3 bg-[#1E1E2F] border border-gray-700 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-purple-500"
        rows={3}
        placeholder="Ask AI to create a quick note..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={generateMarkdown}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        {markdown && (
          <>
            <button
              onClick={() => onSave(markdown)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
            >
              Save to Notes
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-lg flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Markdown Preview */}
      {markdown && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Preview</h3>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
