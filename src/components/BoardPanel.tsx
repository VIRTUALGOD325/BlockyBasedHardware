import React from "react";
import { Cpu } from "lucide-react";
import { ConnectionStatus } from "../types";

interface BoardPanelProps {
  connectionStatus: ConnectionStatus;
  connectedPort: string | null;
}

export const BoardPanel: React.FC<BoardPanelProps> = ({
  connectionStatus,
  connectedPort,
}) => {
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

  return (
    <div className="w-full flex flex-col border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#11131c]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-white/5">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">
          Board
        </span>
        <div
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isConnected ? "bg-emerald-400" : "bg-gray-300 dark:bg-white/20"
          }`}
          title={isConnected ? connectedPort ?? "Connected" : "No device"}
        />
      </div>

      {/* Visualization */}
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <div
          className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 border border-dashed transition-colors ${
            isConnected
              ? "border-emerald-400/50 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5"
              : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
          }`}
        >
          <Cpu
            className={`w-10 h-10 ${
              isConnected
                ? "text-emerald-400 dark:text-emerald-500"
                : "text-gray-200 dark:text-white/15"
            }`}
          />
          <span
            className={`text-[10px] font-medium text-center leading-tight px-2 whitespace-pre-line ${
              isConnected
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-300 dark:text-white/20"
            }`}
          >
            {isConnected ? "Connected" : "No board\nconnected"}
          </span>
        </div>
      </div>
    </div>
  );
};
