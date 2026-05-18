import React, { useState, useRef, useEffect } from "react";
import {
  Usb,
  Settings,
  ChevronDown,
  RefreshCw,
  Upload,
  Loader2,
  LogIn,
  Pencil,
  PowerOff,
  FolderOpen,
  FilePlus,
  Save,
  Cloud,
  Trash2,
} from "lucide-react";
import { ConnectionStatus, ThemeMode } from "../types";
import { SerialPortInfo } from "../utils/HardwareConnection";
import { UserMenu } from "./UserMenu";
import { User } from "../hooks/useAuth";
import { CloudProject } from "../hooks/useProject";

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
  // Console
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  // Project
  projectName: string;
  hasUnsavedChanges: boolean;
  onRenameProject: (name: string) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  // Auth
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  // Cloud
  cloudProjectId: number | null;
  cloudProjects: CloudProject[];
  cloudProjectsLoading: boolean;
  onSaveToCloud: () => void;
  onFetchCloudProjects: () => void;
  onLoadCloudProject: (id: number) => void;
  onDeleteCloudProject: (id: number) => void;
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
  isConsoleOpen,
  onToggleConsole,
  projectName,
  hasUnsavedChanges,
  onRenameProject,
  onNewProject,
  onSaveProject,
  onLoadProject,
  user,
  onLoginClick,
  onLogout,
  cloudProjectId,
  cloudProjects,
  cloudProjectsLoading,
  onSaveToCloud,
  onFetchCloudProjects,
  onLoadCloudProject,
  onDeleteCloudProject,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!projectMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [projectMenuOpen]);

  const handleNewProject = () => {
    setProjectMenuOpen(false);
    if (window.confirm("This will clear your current project. Are you sure you want to start a new project?")) {
      onNewProject();
    }
  };

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

  const navigateHome = () => {
    window.location.href = "https://kynacode.com";
  };

  const navigateToScratch = () => {
    window.location.href = "/scratch/";
  };

  return (
    <header className="flex h-[52px] w-full select-none z-[100] relative">
      <div className="flex-1 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/5 relative bg-white dark:bg-[#1a1d27] transition-colors">
        {/* Left Side: Logo | Project Dropdown | Project Name */}
        <div className="flex items-center">
          <button
            onClick={navigateHome}
            className="flex items-center cursor-pointer text-gray-800 dark:text-white hover:opacity-80 transition-opacity mr-4"
            title="Go to KYNA Home"
          >
            <span className="font-semibold text-[17px] tracking-wide font-sans">
              KYNA
            </span>
          </button>

          <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mr-4" />

          {/* Project Dropdown */}
          <div className="relative" ref={projectMenuRef}>
            <button
              onClick={() => setProjectMenuOpen((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-medium text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Project
              <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${projectMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {projectMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                <button
                  onClick={handleNewProject}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12px] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  New Project
                </button>
                <button
                  onClick={() => { setProjectMenuOpen(false); onSaveProject(); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12px] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save to File
                </button>
                <button
                  onClick={() => { setProjectMenuOpen(false); onLoadProject(); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12px] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Open from File
                </button>

                {user && (
                  <>
                    <div className="mx-2 my-1 border-t border-gray-100 dark:border-white/10" />
                    <div className="px-3 py-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">Cloud</span>
                    </div>
                    <button
                      onClick={() => { setProjectMenuOpen(false); onSaveToCloud(); }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12px] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                      {cloudProjectId ? "Update Cloud Save" : "Save to Cloud"}
                    </button>
                    <button
                      onClick={() => { onFetchCloudProjects(); }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12px] text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                      My Cloud Projects {cloudProjects.length > 0 && `(${cloudProjects.length})`}
                    </button>
                    {cloudProjectsLoading && (
                      <div className="px-3 py-1.5 text-[11px] text-gray-400 dark:text-white/40">Loading...</div>
                    )}
                    {cloudProjects.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border-t border-gray-100 dark:border-white/10 mt-1">
                        {cloudProjects.map(p => (
                          <div key={p.id} className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5 group">
                            <button
                              onClick={() => { setProjectMenuOpen(false); onLoadCloudProject(p.id); }}
                              className="flex-1 text-left text-[11px] text-gray-700 dark:text-white/70 truncate"
                              title={p.title}
                            >
                              {p.title}
                            </button>
                            <button
                              onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) onDeleteCloudProject(p.id); }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-500 transition-opacity"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* <button
            className="p-1 rounded text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            onClick={() =>
              (window.location.href = "https://scratch-seven-lemon.vercel.app/")
            }
            title="Back to Scratch"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button> */}

          {/* Project Name (editable) + Unsaved Indicator */}
          <div className="flex items-center gap-1.5 ml-3">
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
                className="text-[13px] font-medium text-gray-800 dark:text-white/90 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500/50 max-w-[180px]"
                maxLength={40}
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1 text-[13px] font-medium text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/90 max-w-[180px] truncate transition-colors group"
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
                  ? "text-emerald-500 dark:text-emerald-400"
                  : isUploading
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-gray-400 dark:text-white/50"
              }`}
            >
              {isConnected ? "Connected" : isUploading ? "Uploading" : "Disconnected"}
            </span>
          </div>

          {/* Port Selector */}
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => {
                if (serialMode === "webserial") {
                  if (!isConnected) onConnectDevice();
                } else {
                  setDropdownOpen(!dropdownOpen);
                }
              }}
              disabled={isConnected || isUploading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                isConnected
                  ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-default"
                  : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-600 dark:text-white/70 hover:text-gray-800 dark:hover:text-white/90"
              }`}
            >
              <Usb className="w-3 h-3" />
              <span className="text-[11px] font-medium">
                {connectedPort || "Select Port"}
              </span>
              {!isConnected && (
                <ChevronDown
                  className={`w-3 h-3 opacity-40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {/* Disconnect button — always visible when connected */}
            {isConnected && !isUploading && (
              <button
                onClick={onDisconnectDevice}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                title="Disconnect device"
              >
                <PowerOff className="w-3 h-3" />
                <span className="text-[10px] font-semibold">Disconnect</span>
              </button>
            )}

            {/* Port Dropdown */}
            {dropdownOpen && serialMode === "link" && !isConnected && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10">
                  <span className="text-[10px] text-gray-500 dark:text-white/50 uppercase font-semibold tracking-wide">
                    Available Ports
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshPorts();
                    }}
                    className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white transition-colors"
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
                        className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <span className="text-[11px] text-gray-800 dark:text-white font-medium block">
                          {port.path}
                        </span>
                        {port.manufacturer && (
                          <span className="text-[9px] text-gray-400 dark:text-white/40 block mt-0.5">
                            {port.manufacturer}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 dark:text-white/40 text-center py-4">
                    {isLinkConnected
                      ? "No devices found. Try refreshing."
                      : "KYNA Link disconnected."}
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
                : "bg-gray-100 dark:bg-white/5"
            }`}
            title={isLinkConnected ? "KYNA Link connected via USB" : "KYNA Link offline"}
          >
            <span className="text-[9px] text-gray-400 dark:text-white/40 font-medium">Link:</span>
            <span
              className={`text-[10px] font-semibold ${
                isLinkConnected ? "text-emerald-500 dark:text-emerald-400" : "text-red-400/70"
              }`}
            >
              {isLinkConnected ? "USB" : "Offline"}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 text-gray-700 dark:text-white">
          {/* Upload Button */}
          <button
            onClick={onRunCode}
            disabled={!isConnected || isUploading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all border text-[11px] font-semibold ${
              isConnected && !isUploading
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/60 border-gray-200 dark:border-white/10"
            }`}
            title="Upload to Board"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {isUploading ? "Uploading..." : "Upload"}
          </button>

          {/* Tools Group */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onToggleCodePanel}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isCodePanelOpen
                  ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white"
                  : "text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-white/70"
              }`}
              title="Toggle Code View"
            >
              <span className="font-mono text-xs font-bold">&lt;/&gt; Code</span>
            </button>
            <button
              onClick={onToggleSerialMonitor}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isSerialMonitorOpen
                  ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white"
                  : "text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-white/70"
              }`}
              title="Toggle Serial Monitor"
            >
              <span className="font-mono text-xs font-bold">Monitor</span>
            </button>
            <button
              onClick={onToggleConsole}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isConsoleOpen
                  ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white"
                  : "text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-white/70"
              }`}
              title="Toggle Console"
            >
              <span className="font-mono text-xs font-bold">Console</span>
            </button>
            <button
              onClick={onToggleSettings}
              className={`px-2 py-1.5 rounded-md transition-all ${
                isSettingsOpen
                  ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white"
                  : "text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-white/70"
              }`}
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          {/* Auth: Login Button or User Menu */}
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 transition-all"
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
