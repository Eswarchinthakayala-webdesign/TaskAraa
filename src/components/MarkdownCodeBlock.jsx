import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

const MarkdownCodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 p-1 rounded-md transition-all duration-300 ${
          copied ? 'text-green-400' : 'text-gray-400 hover:text-white'
        }`}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <SyntaxHighlighter language={language} style={oneDark} className="rounded-md text-sm">
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default MarkdownCodeBlock;
