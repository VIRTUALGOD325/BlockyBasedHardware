import React, { useEffect, useRef } from "react";
import { Terminal, AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { LogMessage } from "../types";

interface ConsolePanelProps {
  logs: LogMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  isOpen,
  onClose,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 shadow-xl transition-colors duration-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-semibold">
          <Terminal className="w-4 h-4" />
          <span>Device Console</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar font-mono text-sm">
        {logs.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-10 italic">
            No active logs. Connect a device to start.
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <div className="mt-0.5 flex-shrink-0">
              {log.type === "info" && (
                <Info className="w-4 h-4 text-blue-500" />
              )}
              {log.type === "success" && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {log.type === "error" && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-800 dark:text-gray-200 break-words leading-tight">
                {log.message}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {log.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
