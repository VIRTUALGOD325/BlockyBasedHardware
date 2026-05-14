import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal, CheckCircle, AlertCircle, Info, X, Trash2, Upload } from "lucide-react";
import { LogMessage, ConnectionStatus } from "../types";

interface ConsoleBarProps {
  logs: LogMessage[];
  isOpen: boolean;
  onClose: () => void;
  uploadProgress: number | null;
  connectionStatus: ConnectionStatus;
  connectedPort: string | null;
}

const MIN_HEIGHT = 60;
const MAX_HEIGHT = 500;
const DEFAULT_HEIGHT = 120;

export const ConsoleBar: React.FC<ConsoleBarProps> = ({
  logs,
  isOpen,
  onClose,
  uploadProgress,
  connectionStatus,
  connectedPort,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragStartY = useRef<number | null>(null);
  const dragStartH = useRef<number>(DEFAULT_HEIGHT);

  // Auto-scroll on new logs
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  // Drag-to-resize handlers
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = height;

    const onMove = (ev: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = dragStartY.current - ev.clientY;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartH.current + delta)));
    };
    const onUp = () => {
      dragStartY.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [height]);

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isUploading = connectionStatus === ConnectionStatus.UPLOADING;

  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#0f1117] flex-shrink-0"
      style={{ height }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        className="h-1 w-full cursor-ns-resize bg-transparent hover:bg-indigo-400/30 transition-colors flex-shrink-0"
        title="Drag to resize"
      />

      {/* Console Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#11131c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
            <span className="text-[11px] font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">
              Output
            </span>
          </div>

          {/* Connection status pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isConnected
                  ? "bg-emerald-400"
                  : isUploading
                    ? "bg-blue-400 animate-pulse"
                    : "bg-gray-300 dark:bg-white/20"
              }`}
            />
            <span className="text-[10px] font-medium text-gray-500 dark:text-white/40">
              {isConnected
                ? connectedPort ?? "Connected"
                : isUploading
                  ? "Uploading…"
                  : "No board"}
            </span>
          </div>

          {/* Upload progress */}
          {isUploading && uploadProgress !== null && uploadProgress >= 0 && (
            <div className="flex items-center gap-1.5">
              <Upload className="w-3 h-3 text-blue-400" />
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-blue-400 font-medium tabular-nums">{uploadProgress}%</span>
            </div>
          )}
          {isUploading && (uploadProgress === null || uploadProgress < 0) && (
            <div className="flex items-center gap-1.5">
              <Upload className="w-3 h-3 text-blue-400 animate-bounce" />
              <span className="text-[10px] text-blue-400 font-medium">Compiling…</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {/* logs are cleared by showing only empty via key trick — parent manages logs */}}
            className="p-1 rounded text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title="Clear (managed by parent)"
            style={{ display: "none" }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title="Close — reopen with Console button in toolbar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 font-mono text-[11px] custom-scrollbar min-h-0">
        {logs.length === 0 && (
          <span className="text-gray-400 dark:text-white/20 italic">
            No output. Connect a board and upload code to see results.
          </span>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="text-gray-300 dark:text-white/20 flex-shrink-0 tabular-nums">
              {log.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="flex-shrink-0 mt-px">
              {log.type === "info" && <Info className="w-3 h-3 text-blue-400" />}
              {log.type === "success" && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              {log.type === "error" && <AlertCircle className="w-3 h-3 text-red-400" />}
            </span>
            <span
              className={`leading-tight break-all ${
                log.type === "error"
                  ? "text-red-500 dark:text-red-400"
                  : log.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
