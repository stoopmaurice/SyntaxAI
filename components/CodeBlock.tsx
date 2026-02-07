
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-4 text-xs font-medium text-slate-400 uppercase tracking-wider">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
          title="Copy to clipboard"
        >
          {copied ? <ICONS.Check className="w-4 h-4 text-green-400" /> : <ICONS.Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm code-font leading-relaxed text-slate-300 min-h-[100px] whitespace-pre-wrap">
        <code>{code || 'Generating...'}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
