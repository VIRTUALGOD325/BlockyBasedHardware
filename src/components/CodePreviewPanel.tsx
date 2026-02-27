import React, { useEffect, useRef } from "react";
import { Code2, X, Copy, Check } from "lucide-react";

interface CodePreviewPanelProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Collapsible panel showing auto-updated Arduino C++ code
 * generated from the Blockly workspace.
 */
export const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({
  code,
  isOpen,
  onClose,
}) => {
  const codeRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-scroll to top when code changes
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = 0;
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  // Simple syntax highlighting for C++ that avoids nested HTML replacements
  const highlightCode = (raw: string): string => {
    if (!raw.trim())
      return '<span class="text-gray-500 italic">// Add blocks to generate code</span>';

    // 1. Wrap tokens in safe placeholders *before* any HTML is introduced
    let text = raw;
    const tokens: string[] = [];
    const pushToken = (style: string, content: string) => {
      // Escape the content so we don't render raw < >
      const escapedContent = content
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      tokens.push(`<span class="${style}">${escapedContent}</span>`);
      return `__TOKEN_${tokens.length - 1}__`;
    };

    // Strings (match "..." before anything else so we don't break HTML)
    text = text.replace(/(".*?")/g, (m) => pushToken("text-green-400", m));

    // Comments
    text = text.replace(/(\/\/.*)/g, (m) =>
      pushToken("text-gray-500 italic", m),
    );

    // Preprocessor
    text = text.replace(/(#\w+.*)/g, (m) => pushToken("text-rose-400", m));

    // Keywords
    text = text.replace(
      /\b(void|int|float|double|char|bool|long|unsigned|const|if|else|for|while|do|return|break|continue|switch|case|default|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|String|byte|boolean)\b/g,
      (m) => pushToken("text-purple-400 font-medium", m),
    );

    // Arduino functions
    text = text.replace(
      /\b(setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|Serial|delay|millis|map|constrain|tone|noTone|attachInterrupt|detachInterrupt)\b/g,
      (m) => pushToken("text-blue-400", m),
    );

    // Numbers
    text = text.replace(/\b(\d+\.?\d*)\b/g, (m) =>
      pushToken("text-orange-400", m),
    );

    // Brackets
    text = text.replace(/([{}[\]()])/g, (m) => pushToken("text-cyan-300", m));

    // 2. Escape remaining un-tokenized HTML characters
    let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // 3. Restore placeholders
    tokens.forEach((token, i) => {
      html = html.replace(`__TOKEN_${i}__`, token);
    });

    return html;
  };

  const lines = code.split("\n");

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-gray-800/80 flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span>Arduino C++</span>
          <span className="text-[10px] font-mono bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded-full">
            Auto-updating
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div
        ref={codeRef}
        className="flex-1 overflow-auto custom-scrollbar bg-gray-950"
      >
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-600 select-none w-8 text-right pr-4 flex-shrink-0 text-xs leading-relaxed">
                {i + 1}
              </span>
              <span
                className="text-gray-200 flex-1"
                dangerouslySetInnerHTML={{
                  __html: highlightCode(line),
                }}
              />
            </div>
          ))}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-700 bg-gray-800/50 text-[10px] text-gray-500 flex-shrink-0">
        <span>{lines.length} lines</span>
        <span>Read-only • Updates on block changes</span>
      </div>
    </div>
  );
};
