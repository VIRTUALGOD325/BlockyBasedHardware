import React from "react";
import {
  X,
  ChevronDown,
  RotateCcw,
  Cpu,
  Gauge,
  Zap,
  ScrollText,
  Save,
  FolderOpen,
  FilePlus,
  Link,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import {
  HardwareSettings,
  BOARD_OPTIONS,
  BAUD_RATE_OPTIONS,
} from "../hooks/useSettings";
import { ThemeMode } from "../types";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HardwareSettings;
  onUpdateSetting: <K extends keyof HardwareSettings>(
    key: K,
    value: HardwareSettings[K],
  ) => void;
  onResetSettings: () => void;
  // Project actions
  onSave: () => void;
  onLoad: () => void;
  onNewProject: () => void;
  // Serial mode
  serialMode: "link" | "webserial";
  onSetSerialMode: (mode: "link" | "webserial") => void;
  isWebSerialSupported: boolean;
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetSettings,
  onSave,
  onLoad,
  onNewProject,
  serialMode,
  onSetSerialMode,
  isWebSerialSupported,
  theme,
  toggleTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1a1d27] border-l border-gray-200 dark:border-white/5 text-gray-800 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#1e2130]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-white/90">
            Settings
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ── Appearance Section ── */}
        <section>
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-[0.15em] mb-3">
            Appearance
          </h3>
          <div className="space-y-3">
            {/* Theme Toggle */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-white/60">
                {theme === "dark" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                Theme
              </label>
              <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    theme === "light"
                      ? "bg-white dark:bg-white text-gray-800 dark:text-[#1a1d27] shadow-sm"
                      : "text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80"
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  Light
                </button>
                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    theme === "dark"
                      ? "bg-white text-[#1a1d27] shadow-sm"
                      : "text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80"
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  Dark
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Project Section ── */}
        <section>
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-[0.15em] mb-3">
            Project
          </h3>
          <div className="space-y-2">
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white/90 transition-colors text-[12px] font-medium"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New Project
            </button>
            <button
              onClick={onSave}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white/90 transition-colors text-[12px] font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              Save to File
            </button>
            <button
              onClick={onLoad}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white/90 transition-colors text-[12px] font-medium"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Open from File
            </button>
          </div>
        </section>

        {/* ── Connection Section ── */}
        <section>
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-[0.15em] mb-3">
            Connection
          </h3>
          <div className="space-y-3">
            {/* Serial Mode */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-white/60">
                <Link className="w-3 h-3" />
                Serial Mode
              </label>
              <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => onSetSerialMode("link")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    serialMode === "link"
                      ? "bg-white dark:bg-white text-gray-800 dark:text-[#1a1d27] shadow-sm"
                      : "text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80"
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
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    serialMode === "webserial"
                      ? "bg-white dark:bg-white text-gray-800 dark:text-[#1a1d27] shadow-sm"
                      : "text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80"
                  } ${!isWebSerialSupported ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <Globe className="w-3 h-3" />
                  Browser
                </button>
              </div>
            </div>

            {/* Board Type */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-white/60">
                <Cpu className="w-3 h-3" />
                Board Type
              </label>
              <div className="relative">
                <select
                  value={settings.boardType}
                  onChange={(e) => onUpdateSetting("boardType", e.target.value)}
                  className="w-full appearance-none bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-[12px] text-gray-800 dark:text-white/90 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-white/[0.07]"
                >
                  {BOARD_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-white dark:bg-[#1e2130] text-gray-800 dark:text-white"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Default Baud Rate */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-white/60">
                <Gauge className="w-3 h-3" />
                Default Baud Rate
              </label>
              <div className="relative">
                <select
                  value={settings.defaultBaudRate}
                  onChange={(e) =>
                    onUpdateSetting("defaultBaudRate", Number(e.target.value))
                  }
                  className="w-full appearance-none bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-[12px] text-gray-800 dark:text-white/90 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-white/[0.07]"
                >
                  {BAUD_RATE_OPTIONS.map((rate) => (
                    <option
                      key={rate}
                      value={rate}
                      className="bg-white dark:bg-[#1e2130] text-gray-800 dark:text-white"
                    >
                      {rate.toLocaleString()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Auto-Connect Toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-white/60">
                <Zap className="w-3 h-3" />
                Auto-connect on load
              </label>
              <button
                onClick={() =>
                  onUpdateSetting("autoConnect", !settings.autoConnect)
                }
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  settings.autoConnect ? "bg-indigo-500" : "bg-gray-200 dark:bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    settings.autoConnect ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── Editor Section ── */}
        <section>
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-[0.15em] mb-3">
            Editor
          </h3>
          <div className="space-y-3">
            {/* Auto-scroll Console */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-white/60">
                <ScrollText className="w-3 h-3" />
                Auto-scroll console
              </label>
              <button
                onClick={() =>
                  onUpdateSetting(
                    "autoScrollConsole",
                    !settings.autoScrollConsole,
                  )
                }
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  settings.autoScrollConsole ? "bg-indigo-500" : "bg-gray-200 dark:bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    settings.autoScrollConsole
                      ? "translate-x-4"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── Advanced Section ── */}
        <section>
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-[0.15em] mb-3">
            Advanced
          </h3>
          <button
            onClick={onResetSettings}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/20 transition-colors text-[12px] font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Settings
          </button>
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-white/5 text-[10px] text-gray-400 dark:text-white/30 text-center">
        EduPrime Hardware v0.1
      </div>
    </div>
  );
};
