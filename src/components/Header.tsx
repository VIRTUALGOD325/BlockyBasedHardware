import React from "react";
import {
  Cpu,
  Usb,
  Wifi,
  WifiOff,
  Rocket,
  Terminal,
  Code2,
  Moon,
  Sun,
  ArrowLeft,
} from "lucide-react";
import { ConnectionStatus, ThemeMode } from "../types";

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  connectionStatus: ConnectionStatus;
  connectedPort: string | null;
  isLinkConnected: boolean;
  onConnectDevice: () => void;
  onDisconnectDevice: () => void;
  onRunCode: () => void;
  isSerialMonitorOpen: boolean;
  onToggleSerialMonitor: () => void;
  isCodePanelOpen: boolean;
  onToggleCodePanel: () => void;
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
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return "bg-green-500/20 text-green-100 border border-green-400/30";
      case ConnectionStatus.UPLOADING:
        return "bg-blue-500/20 text-blue-100 border border-blue-400/30 animate-pulse";
      case ConnectionStatus.ERROR:
        return "bg-red-500/20 text-red-100 border border-red-400/30";
      default:
        return "bg-white/10 text-white/60 border border-white/10";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return connectedPort || "Connected";
      case ConnectionStatus.UPLOADING:
        return "Uploading...";
      case ConnectionStatus.ERROR:
        return "Error";
      default:
        return "Disconnected";
    }
  };

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

  const navigateToScratch = () => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      window.location.href = "http://localhost:8601/";
    } else {
      window.location.href = `https://${hostname.replace("hardware.", "")}/`;
    }
  };

  return (
    <header
      className="h-14 px-5 flex items-center justify-between z-20 relative shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, hsla(215,65%,55%,1) 0%, hsla(215,70%,45%,1) 50%, hsla(220,60%,40%,1) 100%)",
        boxShadow:
          "0 4px 20px rgba(34,107,195,0.3), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
        fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Left: Logo + Navigation */}
      <div className="flex items-center gap-3">
        {/* Back to Scratch */}
        <button
          onClick={navigateToScratch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-all"
          title="Back to Scratch"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Scratch
        </button>

        <div className="w-px h-6 bg-white/20" />

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shadow-inner">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">
            Edu<span className="text-white/80">Prime</span>
            <span className="text-white/50 font-normal text-xs ml-1.5">
              Hardware
            </span>
          </h1>
        </div>
      </div>

      {/* Center: Connection */}
      <div className="hidden md:flex items-center gap-2">
        {!connectedPort ? (
          <button
            onClick={onConnectDevice}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-all font-medium text-sm border border-white/10"
          >
            <Usb className="w-4 h-4" />
            Connect Device
          </button>
        ) : (
          <button
            onClick={onDisconnectDevice}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/15 text-red-200 rounded-lg hover:bg-red-500/25 transition-all font-medium text-sm border border-red-400/20"
          >
            <WifiOff className="w-4 h-4" />
            Disconnect
          </button>
        )}

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all ${getStatusColor()}`}
        >
          {connectionStatus === ConnectionStatus.CONNECTED ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
          )}
          {getStatusText()}
        </div>

        {/* Link Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all ${
            isLinkConnected
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
              : "bg-amber-500/15 text-amber-200/70 border border-amber-400/20"
          }`}
          title={
            isLinkConnected
              ? "EduPrime Link is running — compile & upload available"
              : "EduPrime Link not detected — compile-only mode"
          }
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${isLinkConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400/50"}`}
          />
          {isLinkConnected ? "Link" : "No Link"}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Execute Code */}
        <button
          onClick={onRunCode}
          disabled={
            !connectedPort || connectionStatus === ConnectionStatus.UPLOADING
          }
          className={`
            flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-sm transition-all
            bg-white/15 hover:bg-white/25 text-white border border-white/10
            ${
              !connectedPort || connectionStatus === ConnectionStatus.UPLOADING
                ? "opacity-40 cursor-not-allowed"
                : "hover:shadow-lg"
            }
          `}
          title="Compile and upload code to device"
        >
          {connectionStatus === ConnectionStatus.UPLOADING ? (
            <>
              <Rocket className="w-4 h-4 animate-bounce" />
              Executing...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Execute
            </>
          )}
        </button>

        <div className="w-px h-6 bg-white/15 mx-0.5" />

        {/* Code Panel Toggle */}
        <button
          onClick={onToggleCodePanel}
          title={isCodePanelOpen ? "Close Code View" : "Open Code View"}
          className={`p-2 rounded-lg transition-all ${
            isCodePanelOpen
              ? "bg-white/25 text-white shadow-inner"
              : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
          }`}
          aria-label="Toggle Code View"
        >
          <Code2 className="w-4.5 h-4.5" />
        </button>

        {/* Serial Monitor Toggle */}
        <button
          onClick={onToggleSerialMonitor}
          title={
            isSerialMonitorOpen ? "Close Serial Monitor" : "Open Serial Monitor"
          }
          className={`p-2 rounded-lg transition-all ${
            isSerialMonitorOpen
              ? "bg-white/25 text-white shadow-inner"
              : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
          }`}
          aria-label="Toggle Serial Monitor"
        >
          <Terminal className="w-4.5 h-4.5" />
        </button>

        <div className="w-px h-6 bg-white/15 mx-0.5" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4.5 h-4.5" />
          ) : (
            <Moon className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </header>
  );
};
