import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import {
  Terminal,
  Trash2,
  Send,
  ArrowDown,
  Settings,
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
  onClear,
  onSend,
  onBaudRateChange,
  connectedPort,
}) => {
  const [input, setInput] = useState("");
  const [lineEnding, setLineEnding] = useState("\n");
  const [baudRate, setBaudRate] = useState(9600);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    const trimmed = input; // Might want to keep spaces depending on use case.
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
    <div className="flex flex-col w-full h-full bg-white dark:bg-[#1e1e1e] transition-colors duration-200">
      {/* ── Output Area ── */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={outputRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed custom-scrollbar bg-transparent space-y-1 text-gray-400"
        >
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 select-none">
              <span className="text-xs opacity-50 font-sans">
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
                  <span className="text-gray-600 flex-shrink-0 select-none mr-2">
                    {ts}
                  </span>
                  <span className="text-gray-600 flex-shrink-0 select-none mr-2">
                    {line.direction === "tx" ? "<-" : "->"}
                  </span>
                  <span
                    className={`break-all ${
                      line.direction === "tx"
                        ? "text-blue-500 dark:text-blue-400"
                        : line.direction === "system"
                          ? "text-yellow-600 dark:text-yellow-500"
                          : "text-gray-800 dark:text-gray-300"
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
            className="absolute bottom-3 right-3 p-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-[#3B4358] dark:hover:bg-[#4B5563] text-gray-700 dark:text-white rounded-full shadow-lg transition-all animate-bounce"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Input Row ── */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-[#21252b] border-t border-gray-200 dark:border-white/5 px-4 py-2 flex flex-col gap-2 transition-colors">
        <div className="flex gap-2 items-center">
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
            className="flex-1 min-w-0 px-3 py-1.5 text-[12px] font-mono rounded bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-[#3a76c4] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          <button
            onClick={handleSend}
            disabled={!connectedPort || !input.trim()}
            title="Send (Enter)"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4a76c4] hover:bg-[#5b87d5] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>

          <button
            onClick={onClear}
            title="Clear output"
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Serial Settings"
            className={`p-1.5 rounded transition-colors ${showSettings ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-300" : "hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Expandable Settings Row */}
        {showSettings && (
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 py-1 animate-in slide-in-from-top-1">
            {/* Line ending */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wide font-bold">
                Line Ending
              </label>
              <select
                value={lineEnding}
                onChange={(e) => setLineEnding(e.target.value)}
                className="appearance-none px-2 py-1 text-[11px] font-mono bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-300 rounded focus:border-blue-500 dark:focus:border-[#3a76c4] outline-none"
              >
                {LINE_ENDINGS.map((le) => (
                  <option key={le.label} value={le.value}>
                    {le.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Baud rate */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wide font-bold">
                Baud Rate
              </label>
              <select
                value={baudRate}
                onChange={(e) => {
                  const newBaud = Number(e.target.value);
                  setBaudRate(newBaud);
                  onBaudRateChange(newBaud);
                }}
                className="appearance-none px-2 py-1 text-[11px] font-mono bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-300 rounded focus:border-blue-500 dark:focus:border-[#3a76c4] outline-none"
              >
                {BAUD_RATES.map((b) => (
                  <option key={b} value={b}>
                    {b.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
