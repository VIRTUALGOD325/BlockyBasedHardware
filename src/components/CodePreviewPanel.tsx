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

  const isDefaultEmpty =
    !code.trim() ||
    code.trim() === "void setup() {\n}\n\nvoid loop() {\n}" ||
    code.trim() === "void setup() {\n}\n\nvoid loop() {\n\n}";

  const displayCode = isDefaultEmpty
    ? "void setup() {\n  // Add blocks to generate code inside each.\n}\n\nvoid loop() {\n  \n}"
    : code;

  const lines = displayCode.split("\n");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#181a1f] bg-gray-50 dark:bg-[#21252b] flex-shrink-0 transition-colors">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-sm">
          <Code2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>Arduino C++</span>
          <span className="text-[10px] font-mono bg-blue-100 dark:bg-[#16274a] text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
            Auto-updating
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div
        ref={codeRef}
        className="flex-1 overflow-auto custom-scrollbar bg-transparent"
      >
        <pre className="p-5 text-[13px] font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-600 select-none w-8 text-right pr-4 flex-shrink-0 text-xs leading-relaxed">
                {i + 1}
              </span>
              <span
                className="text-gray-800 dark:text-gray-300 flex-1"
                dangerouslySetInnerHTML={{
                  __html: highlightCode(line),
                }}
              />
            </div>
          ))}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-gray-200 dark:border-[#181a1f] bg-gray-50 dark:bg-[#21252b] text-[11px] font-medium text-gray-500 flex-shrink-0 transition-colors">
        <span>{lines.length} lines</span>
        <span>Read-only • Updates on block changes</span>
      </div>
    </div>
  );
};
