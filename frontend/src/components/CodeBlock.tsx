import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  // If this is a Mermaid diagram block, render with MermaidDiagram component!
  if (language === 'mermaid') {
    return <MermaidDiagram chart={value} />;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = language ? language.toUpperCase() : 'CODE';

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <div className="code-lang-tag">
          <Terminal size={12} className="code-terminal-icon" />
          <span>{displayLang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-btn"
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="copy-icon-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        <code>{value}</code>
      </pre>
    </div>
  );
};

