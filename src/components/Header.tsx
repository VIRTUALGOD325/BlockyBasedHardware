import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Cpu, 
  Usb, 
  Bluetooth, 
  Play, 
  Square,
  ChevronDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ConnectionStatus, DevicePort, ThemeMode } from '../types';
import { MOCK_PORTS } from '../constants';

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  connectionStatus: ConnectionStatus;
  onConnect: (port: DevicePort) => void;
  onDisconnect: () => void;
  onRun: () => void;
  onStop: () => void;
  isRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  connectionStatus,
  onConnect,
  onDisconnect,
  onRun,
  onStop,
  isRunning
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED: return 'bg-green-500 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case ConnectionStatus.CONNECTING: return 'bg-yellow-500 text-yellow-100 animate-pulse';
      case ConnectionStatus.ERROR: return 'bg-red-500 text-red-100';
      default: return 'bg-gray-400 dark:bg-gray-600 text-gray-100';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED: return 'Connected';
      case ConnectionStatus.CONNECTING: return 'Connecting...';
      case ConnectionStatus.ERROR: return 'Error';
      default: return 'Disconnected';
    }
  };

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
      <div className="hidden md:flex items-center gap-4">
        <div className="relative">
          {connectionStatus === ConnectionStatus.DISCONNECTED ? (
            <div className="flex rounded-lg shadow-sm">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-l-lg border-r border-gray-300 dark:border-gray-600 transition-colors font-medium text-sm"
              >
                <Usb className="w-4 h-4" />
                Select Device
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : (
            <button 
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium text-sm"
            >
              <WifiOff className="w-4 h-4" />
              Disconnect
            </button>
          )}

          {/* Dropdown Menu */}
          {isDropdownOpen && connectionStatus === ConnectionStatus.DISCONNECTED && (
            <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Available Ports</div>
              {MOCK_PORTS.map((port) => (
                <button
                  key={port.id}
                  onClick={() => {
                    onConnect(port);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-brand-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors group"
                >
                  {port.type === 'BLUETOOTH' ? (
                    <Bluetooth className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Usb className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{port.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ${getStatusColor()}`}>
          {connectionStatus === ConnectionStatus.CONNECTED ? <Wifi className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>}
          {getStatusText()}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Run Button */}
        <button
          onClick={isRunning ? onStop : onRun}
          disabled={connectionStatus !== ConnectionStatus.CONNECTED}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all
            ${isRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
              : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
            }
            ${connectionStatus !== ConnectionStatus.CONNECTED ? 'opacity-50 cursor-not-allowed saturate-0 shadow-none' : 'hover:-translate-y-0.5'}
          `}
        >
          {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isRunning ? 'Stop' : 'Run Code'}
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
