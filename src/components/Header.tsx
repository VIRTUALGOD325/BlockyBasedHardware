import React, { useState } from "react";
import {
  Moon,
  Sun,
  Cpu,
  Usb,
  Play,
  Upload,
  Wifi,
  WifiOff,
  LinkIcon,
  Rocket,
} from "lucide-react";
import { ConnectionStatus, ThemeMode } from "../types";

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  connectionStatus: ConnectionStatus;
  connectedPort: string | null;
  onConnectLink: () => void;
  onDisconnectLink: () => void;
  onOpenDeviceModal: () => void;
  onDisconnectDevice: () => void;
  onUpload: () => void;
  onRunCode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  connectionStatus,
  connectedPort,
  onConnectLink,
  onDisconnectLink,
  onOpenDeviceModal,
  onDisconnectDevice,
  onUpload,
  onRunCode,
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return "bg-green-500 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
      case ConnectionStatus.CONNECTING:
        return "bg-yellow-500 text-yellow-100 animate-pulse";
      case ConnectionStatus.UPLOADING:
        return "bg-blue-500 text-blue-100 animate-pulse";
      case ConnectionStatus.ERROR:
        return "bg-red-500 text-red-100";
      default:
        return "bg-gray-400 dark:bg-gray-600 text-gray-100";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return connectedPort
          ? `Connected (${connectedPort})`
          : "Link Connected";
      case ConnectionStatus.CONNECTING:
        return "Connecting...";
      case ConnectionStatus.UPLOADING:
        return "Uploading...";
      case ConnectionStatus.ERROR:
        return "Error";
      default:
        return "Disconnected";
    }
  };

  const isLinkConnected = connectionStatus !== ConnectionStatus.DISCONNECTED;

  return (
    <header className="h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-20 relative shadow-sm transition-colors duration-200">
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
          <Cpu className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-gray-800 dark:text-white tracking-tight">
          Robo<span className="text-brand-500">Blocks</span>
        </h1>
      </div>

      {/* Connection Controls */}
      <div className="hidden md:flex items-center gap-3">
        {/* Link Connection */}
        {!isLinkConnected ? (
          <button
            onClick={onConnectLink}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-md"
          >
            <LinkIcon className="w-4 h-4" />
            Connect Link
          </button>
        ) : (
          <>
            {/* Device Selection */}
            {!connectedPort ? (
              <button
                onClick={onOpenDeviceModal}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium text-sm"
              >
                <Usb className="w-4 h-4" />
                Select Device
              </button>
            ) : (
              <button
                onClick={onDisconnectDevice}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium text-sm"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect Device
              </button>
            )}

            {/* Disconnect Link */}
            <button
              onClick={onDisconnectLink}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              title="Disconnect from Eduprime-Link"
            >
              <WifiOff className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ${getStatusColor()}`}
        >
          {connectionStatus === ConnectionStatus.CONNECTED ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>
          )}
          {getStatusText()}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Run Code — one-click convert + upload, skips Link GUI */}
        <button
          onClick={onRunCode}
          disabled={
            !connectedPort || connectionStatus === ConnectionStatus.UPLOADING
          }
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all
            bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/30
            ${!connectedPort || connectionStatus === ConnectionStatus.UPLOADING ? "opacity-50 cursor-not-allowed saturate-0 shadow-none" : "hover:-translate-y-0.5"}
          `}
          title="Convert blocks to C++ and upload directly"
        >
          {connectionStatus === ConnectionStatus.UPLOADING ? (
            <>
              <Rocket className="w-4 h-4 animate-bounce" />
              Running...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Run Code
            </>
          )}
        </button>

        {/* Upload Button — sends code to Link GUI for preview first */}
        <button
          onClick={onUpload}
          disabled={
            !connectedPort || connectionStatus === ConnectionStatus.UPLOADING
          }
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all
            bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200
            ${!connectedPort || connectionStatus === ConnectionStatus.UPLOADING ? "opacity-50 cursor-not-allowed" : ""}
          `}
          title="Preview code in Link GUI then upload"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
};
