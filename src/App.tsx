import React from "react";
import { Header } from "./components/Header";
import { BlocklyEditor } from "./components/BlocklyEditor";
import { ConsolePanel } from "./components/ConsolePanel";
import { SerialMonitor } from "./components/SerialMonitor";
import { CodePreviewPanel } from "./components/CodePreviewPanel";
import { useTheme } from "./hooks/useTheme";
import { useHardware } from "./hooks/useHardware";
import { Terminal, Code2 } from "lucide-react";
import { useState, useCallback, useRef } from "react";

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const {
    connectionStatus,
    connectedPort,
    logs,
    serialLines,
    isLinkConnected,
    connectToDevice,
    disconnectDevice,
    uploadCode,
    sendSerialData,
    clearSerialLines,
    addLog,
  } = useHardware();

  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isSerialMonitorOpen, setIsSerialMonitorOpen] = useState(true);
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation — Scratch-style blue gradient */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        connectedPort={connectedPort}
        isLinkConnected={isLinkConnected}
        onConnectDevice={() => connectToDevice()}
        onDisconnectDevice={disconnectDevice}
        onRunCode={handleRunCode}
        isSerialMonitorOpen={isSerialMonitorOpen}
        onToggleSerialMonitor={() => setIsSerialMonitorOpen((v) => !v)}
        isCodePanelOpen={isCodePanelOpen}
        onToggleCodePanel={() => setIsCodePanelOpen((v) => !v)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Area: Blockly + Code Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Blockly Editor */}
          <div className="flex-1 relative bg-white dark:bg-gray-800 transition-colors duration-200">
            <BlocklyEditor themeMode={theme} onCodeChange={handleCodeChange} />

            {/* Floating Top Toggles for Bottom Panels (if both closed) */}
            {!isConsoleOpen && !isSerialMonitorOpen && (
              <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                {!isConsoleOpen && (
                  <button
                    onClick={() => setIsConsoleOpen(true)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                    title="Open Console"
                  >
                    <Terminal className="w-6 h-6" />
                  </button>
                )}
              </div>
            )}
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

        {/* Bottom Area: Console & Serial Monitor */}
        {(isConsoleOpen || isSerialMonitorOpen) && (
          <div className="h-64 flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
            {/* Device Console (Left/Full) */}
            {isConsoleOpen && (
              <div
                className={`${isSerialMonitorOpen ? "w-1/2 border-r" : "w-full"} border-gray-200 dark:border-gray-700 overflow-hidden`}
              >
                <ConsolePanel
                  logs={logs}
                  isOpen={isConsoleOpen}
                  onClose={() => setIsConsoleOpen(false)}
                />
              </div>
            )}

            {/* Serial Monitor (Right/Full) */}
            {isSerialMonitorOpen && (
              <div
                className={`${isConsoleOpen ? "w-1/2" : "w-full"} overflow-hidden`}
              >
                <SerialMonitor
                  lines={serialLines}
                  isOpen={isSerialMonitorOpen}
                  onClose={() => setIsSerialMonitorOpen(false)}
                  onSend={sendSerialData}
                  onClear={clearSerialLines}
                  onBaudRateChange={(newBaud) => {
                    if (connectedPort) {
                      disconnectDevice();
                      connectToDevice(newBaud);
                    }
                  }}
                  connectedPort={connectedPort}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
