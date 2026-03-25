import React, { useState, useRef, useEffect } from "react";
import {
  Usb,
  Settings,
  ChevronDown,
  RefreshCw,
  Play,
  LogIn,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { ConnectionStatus, ThemeMode } from "../types";
import { SerialPortInfo } from "../utils/HardwareConnection";
import { UserMenu } from "./UserMenu";
import { User } from "../hooks/useAuth";

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
  // Settings
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  // Project
  projectName: string;
  hasUnsavedChanges: boolean;
  onRenameProject: (name: string) => void;
  // Auth
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
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
  isSettingsOpen,
  onToggleSettings,
  projectName,
  hasUnsavedChanges,
  onRenameProject,
  user,
  onLoginClick,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== projectName) {
      onRenameProject(trimmed);
    } else {
      setEditName(projectName);
    }
    setIsEditingName(false);
  };

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
        {/* Left Side: Logo, Nav, Project Name */}
        <div className="flex items-center gap-3">
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

          <button
            className="p-1 rounded text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            onClick={() =>
              (window.location.href = "https://scratch-seven-lemon.vercel.app/")
            }
            title="Back to Scratch"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-white/20 text-xs">|</span>

          {/* Project Name (editable) + Unsaved Indicator */}
          <div className="flex items-center gap-1.5">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setEditName(projectName);
                    setIsEditingName(false);
                  }
                }}
                className="text-[13px] font-medium text-white/90 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500/50 max-w-[180px]"
                maxLength={40}
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1 text-[13px] font-medium text-white/60 hover:text-white/90 max-w-[180px] truncate transition-colors group"
                title="Click to rename"
              >
                <span className="truncate">{projectName}</span>
                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
              </button>
            )}
            {hasUnsavedChanges && (
              <span className="text-amber-400 text-[14px] leading-none" title="Unsaved changes">
                ●
              </span>
            )}
          </div>
        </div>

        {/* Center: Connection (compact) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected
                  ? "bg-emerald-400"
                  : isUploading
                    ? "bg-blue-400 animate-pulse"
                    : "bg-amber-500"
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-wide ${
                isConnected
                  ? "text-emerald-400"
                  : isUploading
                    ? "text-blue-400"
                    : "text-white/50"
              }`}
            >
              {isConnected ? "Connected" : isUploading ? "Uploading" : "Disconnected"}
            </span>
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors text-white/70 hover:text-white/90"
            >
              <Usb className="w-3 h-3" />
              <span className="text-[11px] font-medium">
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

          {/* Link badge */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
              isLinkConnected
                ? "bg-emerald-400/10"
                : "bg-white/5"
            }`}
            title={isLinkConnected ? "EduPrime Link connected via USB" : "EduPrime Link offline"}
          >
            <span className="text-[9px] text-white/40 font-medium">Link:</span>
            <span
              className={`text-[10px] font-semibold ${
                isLinkConnected ? "text-emerald-400" : "text-red-400/70"
              }`}
            >
              {isLinkConnected ? "USB" : "Offline"}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 text-white">
          {/* Execute Button */}
          <button
            onClick={onRunCode}
            disabled={!isConnected || isUploading}
            className={`p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all border ${
              isConnected && !isUploading
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-white/5 text-white/60 border-white/10"
            }`}
            title="Execute"
          >
            <Play
              className={`w-4 h-4 ${isUploading ? "animate-bounce" : ""}`}
            />
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
              onClick={onToggleSettings}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isSettingsOpen
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              }`}
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Auth: Login Button or User Menu */}
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white/60 hover:text-white/90 hover:bg-white/5 border border-white/10 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
