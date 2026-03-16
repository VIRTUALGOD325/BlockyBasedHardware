import React from "react";
import { Header } from "./components/Header";
import { BlocklyEditor } from "./components/BlocklyEditor";
import { ConsolePanel } from "./components/ConsolePanel";
import { SerialMonitor } from "./components/SerialMonitor";
import { CodePreviewPanel } from "./components/CodePreviewPanel";
import { useTheme } from "./hooks/useTheme";
import { useHardware } from "./hooks/useHardware";
import {
  Terminal,
  Code2,
  Activity,
  ChevronUp,
  ChevronDown,
  Monitor,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";

type BottomTab = "console" | "serial";

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const {
    connectionStatus,
    connectedPort,
    logs,
    serialLines,
    isLinkConnected,
    availablePorts,
    serialMode,
    setSerialMode,
    isWebSerialSupported,
    connectToDevice,
    disconnectDevice,
    uploadCode,
    sendSerialData,
    clearSerialLines,
    refreshPorts,
    addLog,
  } = useHardware();

  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>("console");
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);

  // Store generated code for upload and code preview
  const generatedCodeRef = useRef<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const handleCodeChange = (code: string) => {
    generatedCodeRef.current = code;
    setGeneratedCode(code);
  };

  // Run Code — one-click: convert blocks → C++ → upload directly
  const handleRunCode = useCallback(() => {
    const code = generatedCodeRef.current;
    if (!code.trim()) {
      addLog("No code to run. Add some blocks first.", "error");
      return;
    }
    uploadCode(code);
  }, [uploadCode, addLog]);

  const handleTabClick = (tab: BottomTab) => {
    if (activeBottomTab === tab && isBottomPanelOpen) {
      // Clicking active tab toggles collapse
      setIsBottomPanelOpen(false);
    } else {
      setActiveBottomTab(tab);
      setIsBottomPanelOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#0f1117]">
      {/* Top Navigation */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        connectedPort={connectedPort}
        isLinkConnected={isLinkConnected}
        onConnectDevice={connectToDevice}
        onDisconnectDevice={disconnectDevice}
        onRunCode={handleRunCode}
        isSerialMonitorOpen={isBottomPanelOpen && activeBottomTab === "serial"}
        onToggleSerialMonitor={() => handleTabClick("serial")}
        isCodePanelOpen={isCodePanelOpen}
        onToggleCodePanel={() => setIsCodePanelOpen((v) => !v)}
        serialMode={serialMode}
        onSetSerialMode={setSerialMode}
        isWebSerialSupported={isWebSerialSupported}
        availablePorts={availablePorts}
        onRefreshPorts={refreshPorts}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Area: Blockly + Code Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Blockly Editor */}
          <div className="flex-1 relative bg-white dark:bg-[#141620] transition-colors duration-200">
            <BlocklyEditor themeMode={theme} onCodeChange={handleCodeChange} />
          </div>

          {/* Right Side: Code Preview Panel */}
          <div
            className={`${
              isCodePanelOpen ? "w-80 md:w-96" : "w-0"
            } transition-all duration-300 ease-in-out overflow-hidden h-full z-10 flex flex-col`}
          >
            {isCodePanelOpen && (
              <div className="h-full overflow-hidden border-b border-gray-200 dark:border-gray-700">
                <CodePreviewPanel
                  code={generatedCode}
                  isOpen={isCodePanelOpen}
                  onClose={() => setIsCodePanelOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══ BOTTOM PANEL: Tabbed & Collapsible ═══ */}
        <div
          className="flex-shrink-0 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#1a1d27] z-20 flex flex-col transition-all duration-300"
          style={{ height: isBottomPanelOpen ? "256px" : "32px" }}
        >
          {/* Tab Bar (Always visible — acts as status bar when collapsed) */}
          <div
            className="h-8 flex-shrink-0 flex items-center justify-between px-3 bg-gray-50 dark:bg-[#1a1d27] border-b border-gray-200 dark:border-white/5"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(180deg, #1a1d27 0%, #171a24 100%)"
                  : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
            {/* Left: Tabs */}
            <div className="flex items-center gap-0.5">
              {/* Status indicator */}
              <div className="flex items-center gap-1.5 mr-3">
                <Activity className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Device Status:{" "}
                  <span
                    className={
                      connectedPort
                        ? "text-emerald-500"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  >
                    {connectedPort ? "Active" : "Idle"}
                  </span>
                </span>
              </div>

              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Console Tab */}
              <button
                onClick={() => handleTabClick("console")}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  activeBottomTab === "console" && isBottomPanelOpen
                    ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
              >
                <Terminal className="w-3 h-3" />
                Console
                {logs.length > 0 && (
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1 rounded-full min-w-[16px] text-center">
                    {logs.length}
                  </span>
                )}
              </button>

              {/* Serial Monitor Tab */}
              <button
                onClick={() => handleTabClick("serial")}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  activeBottomTab === "serial" && isBottomPanelOpen
                    ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
              >
                <Monitor className="w-3 h-3" />
                Monitor
                {serialLines.length > 0 && (
                  <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-1 rounded-full min-w-[16px] text-center">
                    {serialLines.length > 99 ? "99+" : serialLines.length}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Collapse toggle */}
            <button
              onClick={() => setIsBottomPanelOpen((v) => !v)}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              title={isBottomPanelOpen ? "Collapse panel" : "Expand panel"}
            >
              {isBottomPanelOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Panel Content */}
          {isBottomPanelOpen && (
            <div className="flex-1 overflow-hidden">
              {activeBottomTab === "console" ? (
                <ConsolePanel
                  logs={logs}
                  isOpen={true}
                  onClose={() => setIsBottomPanelOpen(false)}
                />
              ) : (
                <SerialMonitor
                  lines={serialLines}
                  isOpen={true}
                  onClose={() => setIsBottomPanelOpen(false)}
                  onSend={sendSerialData}
                  onClear={clearSerialLines}
                  onBaudRateChange={(newBaud) => {
                    if (connectedPort) {
                      disconnectDevice();
                      if (serialMode === "link") {
                        connectToDevice(connectedPort, newBaud);
                      } else {
                        connectToDevice(newBaud);
                      }
                    }
                  }}
                  connectedPort={connectedPort}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
