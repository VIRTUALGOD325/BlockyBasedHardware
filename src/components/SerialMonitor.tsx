import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import {
  Terminal,
  X,
  Trash2,
  Send,
  ArrowDown,
  ChevronDown,
} from "lucide-react";

export interface SerialLine {
  id: string;
  text: string;
  direction: "rx" | "tx" | "system";
  timestamp: Date;
}

interface SerialMonitorProps {
  lines: SerialLine[];
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: string) => void;
  onClear: () => void;
  onBaudRateChange: (baudRate: number) => void;
  connectedPort: string | null;
}

const LINE_ENDINGS = [
  { label: "No line ending", value: "" },
  { label: "Newline", value: "\n" },
  { label: "Carriage return", value: "\r" },
  { label: "Both NL & CR", value: "\r\n" },
];

const BAUD_RATES = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400,
  250000, 500000, 1000000, 2000000,
];

export const SerialMonitor: React.FC<SerialMonitorProps> = ({
  lines,
  isOpen,
  onClose,
  onSend,
  onClear,
  onBaudRateChange,
  connectedPort,
}) => {
  const [input, setInput] = useState("");
  const [lineEnding, setLineEnding] = useState("\n");
  const [baudRate, setBaudRate] = useState(9600);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new lines
  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    if (!outputRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
      setAutoScroll(true);
      setShowScrollBtn(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !connectedPort) return;
    onSend(trimmed + lineEnding);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 shadow-xl transition-colors duration-200">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-semibold text-sm">
          <Terminal className="w-4 h-4 text-brand-500" />
          <span>Serial Monitor</span>
          {connectedPort && (
            <span className="text-[10px] font-mono bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
              {connectedPort}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            title="Clear output"
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Output Area ── */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={outputRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-3 font-mono text-xs leading-relaxed custom-scrollbar bg-gray-950 dark:bg-gray-950 space-y-0.5"
        >
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 select-none">
              <Terminal className="w-8 h-8 opacity-30" />
              <span className="text-xs opacity-50">
                {connectedPort
                  ? "Waiting for data…"
                  : "Connect a device to start monitoring"}
              </span>
            </div>
          ) : (
            lines.map((line) => {
              const ts = line.timestamp.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                fractionalSecondDigits: 3,
              } as Intl.DateTimeFormatOptions);

              return (
                <div
                  key={line.id}
                  className="flex items-start group whitespace-pre-wrap"
                >
                  {/* Arduino-style: timestamp -> text */}
                  <span className="text-gray-500 flex-shrink-0 select-none">
                    {ts}
                  </span>
                  <span className="text-gray-500 flex-shrink-0 select-none mx-1">
                    {line.direction === "tx" ? "<-" : "->"}
                  </span>
                  <span
                    className={`break-all ${
                      line.direction === "tx"
                        ? "text-blue-300"
                        : line.direction === "system"
                          ? "text-yellow-400"
                          : "text-gray-200"
                    }`}
                  >
                    {line.text}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg transition-all animate-bounce"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Input Row ── */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-2 space-y-2">
        {/* Text input + Send */}
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              connectedPort ? "Send a message…" : "No device connected"
            }
            disabled={!connectedPort}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!connectedPort || !input.trim()}
            title="Send (Enter)"
            className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors flex-shrink-0"
          >
            <Send className="w-3 h-3" />
            Send
          </button>
        </div>

        {/* Controls row: line ending + baud rate */}
        <div className="flex items-center gap-2">
          {/* Line ending */}
          <div className="flex items-center gap-1 flex-1">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Line ending
            </label>
            <div className="relative flex-1">
              <select
                value={lineEnding}
                onChange={(e) => setLineEnding(e.target.value)}
                className="w-full appearance-none pl-2 pr-6 py-1 text-[10px] font-mono rounded bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {LINE_ENDINGS.map((le) => (
                  <option key={le.label} value={le.value}>
                    {le.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Baud rate */}
          <div className="flex items-center gap-1 flex-1">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Baud
            </label>
            <div className="relative flex-1">
              <select
                value={baudRate}
                onChange={(e) => {
                  const newBaud = Number(e.target.value);
                  setBaudRate(newBaud);
                  onBaudRateChange(newBaud);
                }}
                className="w-full appearance-none pl-2 pr-6 py-1 text-[10px] font-mono rounded bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {BAUD_RATES.map((b) => (
                  <option key={b} value={b}>
                    {b.toLocaleString()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
