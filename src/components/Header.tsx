import React, { useState } from "react";
import {
  Usb,
  Settings,
  ChevronDown,
  RefreshCw,
  Link,
  Globe,
  Play,
} from "lucide-react";
import { ConnectionStatus, ThemeMode } from "../types";
import { SerialPortInfo } from "../utils/HardwareConnection";

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  connectionStatus: ConnectionStatus;
  connectedPort: string | null;
  isLinkConnected: boolean;
  onConnectDevice: (
    baudRateOrPort?: number | string,
    baudRate?: number,
  ) => void;
  onDisconnectDevice: () => void;
  onRunCode: () => void;
  isSerialMonitorOpen: boolean;
  onToggleSerialMonitor: () => void;
  isCodePanelOpen: boolean;
  onToggleCodePanel: () => void;
  serialMode: "link" | "webserial";
  onSetSerialMode: (mode: "link" | "webserial") => void;
  isWebSerialSupported: boolean;
  availablePorts: SerialPortInfo[];
  onRefreshPorts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  connectionStatus,
  connectedPort,
  isLinkConnected,
  onConnectDevice,
  onDisconnectDevice,
  onRunCode,
  isSerialMonitorOpen,
  onToggleSerialMonitor,
  isCodePanelOpen,
  onToggleCodePanel,
  serialMode,
  onSetSerialMode,
  isWebSerialSupported,
  availablePorts,
  onRefreshPorts,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isUploading = connectionStatus === ConnectionStatus.UPLOADING;

  const navigateToScratch = () => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      window.location.href = "http://localhost:8601/";
    } else {
      window.location.href = `https://${hostname.replace("hardware.", "")}/`;
    }
  };

  return (
    <header className="flex h-[52px] w-full select-none z-[100] relative">
      <div className="flex-1 flex items-center justify-between px-4 border-b border-white/5 relative bg-[#1a1d27] transition-colors">
        {/* Left Side: Logo and Navigation */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer text-white"
            onClick={navigateToScratch}
          >
            <Settings className="w-5 h-5 text-white/70" />
            <span className="font-semibold text-[17px] tracking-wide font-sans">
              EduPrime
            </span>
          </div>

          <span className="text-white/30 text-xs">•</span>

          <div
            className="flex items-center gap-1.5 text-white/50 hover:text-white/80 cursor-pointer text-[13px] font-medium transition-colors"
            onClick={() =>
              (window.location.href = "https://scratch-seven-lemon.vercel.app/")
            }
          >
            <span>&larr;</span>
            <span>Scratch</span>
          </div>
        </div>

        {/* Center: Connection Center (Inline) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0">
          {/* Connection Status Panel */}
          <div
            className="flex flex-col items-center px-5 py-1.5 border border-white/10 rounded-l-lg bg-white/5 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="text-[9px] font-bold text-white/60 tracking-[0.15em] uppercase">
              Connection Center
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-400"
                    : isUploading
                      ? "bg-blue-400 animate-pulse"
                      : "bg-amber-500"
                }`}
              />
              <span
                className={`text-[11px] font-semibold tracking-wider ${
                  isConnected
                    ? "text-emerald-400"
                    : isUploading
                      ? "text-blue-400"
                      : "text-white/60"
                }`}
              >
                {isConnected
                  ? "CONNECTED"
                  : isUploading
                    ? "UPLOADING"
                    : "DISCONNECTED"}
              </span>
            </div>
          </div>

          {/* Port Selector */}
          <div className="relative">
            <button
              onClick={() => {
                if (serialMode === "webserial") {
                  if (!isConnected) onConnectDevice();
                } else {
                  setDropdownOpen(!dropdownOpen);
                }
              }}
              className="flex items-center gap-2 px-4 py-3 border-y border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-white/70 hover:text-white/90"
            >
              <Usb className="w-3.5 h-3.5" />
              <span className="text-[12px] font-medium">
                {connectedPort || "Select Port"}
              </span>
              <ChevronDown
                className={`w-3 h-3 opacity-40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Port Dropdown */}
            {dropdownOpen && serialMode === "link" && !isConnected && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#1e2130] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wide">
                    Available Ports
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshPorts();
                    }}
                    className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
                {availablePorts.length > 0 ? (
                  <div className="flex flex-col p-1.5 max-h-40 overflow-y-auto">
                    {availablePorts.map((port) => (
                      <button
                        key={port.path}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnectDevice(port.path);
                          setDropdownOpen(false);
                        }}
                        className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                      >
                        <span className="text-[11px] text-white font-medium block">
                          {port.path}
                        </span>
                        {port.manufacturer && (
                          <span className="text-[9px] text-white/40 block mt-0.5">
                            {port.manufacturer}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-white/40 text-center py-4">
                    {isLinkConnected
                      ? "No devices found. Try refreshing."
                      : "EduPrime Link disconnected."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Link Status */}
          <div className="flex flex-col items-center px-4 py-1.5 border border-l-0 border-white/10 rounded-r-lg bg-white/[0.03]">
            <span className="text-[10px] text-white/50 font-medium">Link</span>
            <span
              className={`text-[11px] font-semibold ${isLinkConnected ? "text-emerald-400" : "text-red-400"}`}
            >
              {isLinkConnected ? "USB" : "Offline"}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 text-white">
          {/* Link / Browser Mode Toggle Buttons */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => onSetSerialMode("link")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                serialMode === "link"
                  ? "bg-white text-[#1a1d27] shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Link className="w-3 h-3" />
              Link
            </button>
            <button
              onClick={() => {
                if (isWebSerialSupported) onSetSerialMode("webserial");
              }}
              disabled={!isWebSerialSupported}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                serialMode === "webserial"
                  ? "bg-white text-[#1a1d27] shadow-sm"
                  : "text-white/50 hover:text-white/80"
              } ${!isWebSerialSupported ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <Globe className="w-3 h-3" />
              Browser
            </button>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Execute Button */}
          <button
            onClick={onRunCode}
            disabled={!isConnected || isUploading}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-[12px] font-bold transition-all border ${
              isConnected && !isUploading
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-white/5 text-white/60 border-white/10"
            }`}
          >
            <Play
              className={`w-3.5 h-3.5 ${isUploading ? "animate-bounce" : ""}`}
            />
            Execute
          </button>

          {/* Tools Group */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onToggleCodePanel}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isCodePanelOpen
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              }`}
              title="Toggle Code View"
            >
              <span className="font-mono text-xs font-bold">&lt;/&gt;</span>
            </button>
            <button
              onClick={onToggleSerialMonitor}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isSerialMonitorOpen
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              }`}
              title="Toggle Serial Monitor"
            >
              <span className="font-mono text-xs font-bold">&gt;_</span>
            </button>
            <button
              className="px-2 py-1.5 rounded-md transition-all text-white/40 hover:bg-white/5 hover:text-white/70"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
