import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Copy,
  ImageDown,
  Check,
} from "lucide-react";
import { LogMessage, ConnectionStatus } from "../types";

// ── PNG export helper ────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  // Split on hard newlines first, then word-wrap each line
  const paragraphs = text.split(/\r?\n/);
  const result: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    result.push(line);
  }
  return result;
}

function saveErrorAsPng(log: LogMessage) {
  const scale = 2;
  const W = 600;
  const PAD = 28;
  const HEADER_H = 68;
  const LINE_H = 22;
  const FONT_SIZE = 13;

  // Measure text with a temp canvas
  const tmp = document.createElement("canvas").getContext("2d")!;
  tmp.font = `${FONT_SIZE}px "Courier New", Courier, monospace`;
  const lines = wrapText(tmp, log.message, W - PAD * 2);

  const bodyH = PAD + lines.length * LINE_H + PAD * 1.5;
  const H = HEADER_H + bodyH;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#0d0f17";
  ctx.fillRect(0, 0, W, H);

  // Header panel
  ctx.fillStyle = "#161926";
  ctx.fillRect(0, 0, W, HEADER_H);

  // Red left accent
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(0, 0, 4, HEADER_H);

  // Title
  ctx.fillStyle = "#ef4444";
  ctx.font = `bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillText("Error Report — Kynacode", PAD, 26);

  // Timestamp
  ctx.fillStyle = "#6b7280";
  ctx.font = `11px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillText(log.timestamp.toLocaleString(), PAD, 46);

  // Error text
  ctx.fillStyle = "#f3f4f6";
  ctx.font = `${FONT_SIZE}px "Courier New", Courier, monospace`;
  lines.forEach((line, i) => {
    ctx.fillText(line, PAD, HEADER_H + PAD + i * LINE_H);
  });

  // Footer watermark
  ctx.fillStyle = "#374151";
  ctx.font = `10px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillText("Kynacode Hardware", PAD, H - 10);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kynacode-error-${Date.now()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, "image/png");
}

// ── Toast card ───────────────────────────────────────────────────────────────

interface ToastCardProps {
  log: LogMessage;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ log, onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(log.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [log.message]);

  const isError = log.type === "error";

  const borderColor = isError
    ? "border-red-500/40"
    : log.type === "success"
    ? "border-emerald-500/30"
    : "border-blue-500/20";

  const bgColor = isError
    ? "bg-red-950/60 dark:bg-red-950/80"
    : log.type === "success"
    ? "bg-emerald-950/50 dark:bg-emerald-950/70"
    : "bg-[#1a1d27]/90 dark:bg-[#1a1d27]/95";

  return (
    <div
      className={`relative flex flex-col gap-2 w-80 rounded-xl border backdrop-blur-md shadow-2xl px-3.5 py-3 text-sm ${bgColor} ${borderColor}`}
      style={{ animation: "toast-in 0.2s ease-out" }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {isError ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : log.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <Info className="w-4 h-4 text-blue-400" />
          )}
        </div>
        <p
          className={`flex-1 leading-snug text-[13px] font-medium ${
            isError
              ? "text-red-200"
              : log.type === "success"
              ? "text-emerald-200"
              : "text-gray-200"
          }`}
        >
          {log.message}
        </p>
        <button
          onClick={() => onDismiss(log.id)}
          className="flex-shrink-0 -mt-0.5 -mr-1 p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-gray-500 pl-6 -mt-1">
        {log.timestamp.toLocaleTimeString()}
      </span>

      {/* Error actions */}
      {isError && (
        <div className="flex items-center gap-2 pl-6">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => saveErrorAsPng(log)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            <ImageDown className="w-3 h-3" />
            Save PNG
          </button>
        </div>
      )}
    </div>
  );
};

// ── Progress bar ─────────────────────────────────────────────────────────────

interface UploadProgressBarProps {
  progress: number | null; // null = hidden; -1 = indeterminate; 0-100 = %
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  progress,
}) => {
  if (progress === null) return null;

  return (
    <div className="fixed top-[52px] left-0 right-0 h-[3px] z-50 bg-gray-200/20 dark:bg-white/5 overflow-hidden">
      {progress < 0 ? (
        // Indeterminate — sliding shimmer
        <div
          className="h-full bg-blue-500"
          style={{ animation: "indeterminate 1.4s ease-in-out infinite" }}
        />
      ) : (
        // Determinate
        <div
          className="h-full bg-blue-500 transition-all duration-200 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      )}
    </div>
  );
};

// ── Main export ──────────────────────────────────────────────────────────────

interface StatusToastProps {
  logs: LogMessage[];
}

export const StatusToast: React.FC<StatusToastProps> = ({ logs }) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Only show errors as toasts; info/success are displayed in the serial monitor
  const candidates = logs.filter((l) => l.type === "error").slice(-3);
  const visible = candidates.filter((l) => !dismissedIds.has(l.id));

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  // Auto-dismiss errors after 8 s
  useEffect(() => {
    const timers = visible.map((l) => setTimeout(() => dismiss(l.id), 8000));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs]);

  if (visible.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes indeterminate {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
      <div className="fixed top-[62px] right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {visible.map((log) => (
          <div key={log.id} className="pointer-events-auto">
            <ToastCard log={log} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
};
