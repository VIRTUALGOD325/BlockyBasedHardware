import React from "react";
import { Header } from "./components/Header";
import { BlocklyEditor } from "./components/BlocklyEditor";
import { ConsolePanel } from "./components/ConsolePanel";
import { useTheme } from "./hooks/useTheme";
import { useHardware } from "./hooks/useHardware";
import { Terminal } from "lucide-react";
import { ConnectionModal } from "./components/ConnectionModal";
import { useState, useCallback, useRef } from "react";
import { SerialPortInfo } from "./utils/HardwareConnection";

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Hardware Hook (now talks to Eduprime-Link via WebSocket)
  const {
    connectionStatus,
    connectedPort,
    logs,
    connectToLink,
    disconnectFromLink,
    scanDevices,
    connectToDevice,
    disconnectDevice,
    uploadCode,
    sendCodeToLink,
    addLog,
  } = useHardware();

  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [devices, setDevices] = useState<SerialPortInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Store generated code so we can send it for upload
  const generatedCodeRef = useRef<string>("");

  const handleCodeChange = (code: string) => {
    generatedCodeRef.current = code;
    // Also send to the Link GUI for display
    sendCodeToLink(code);
  };

  const handleOpenConnectModal = useCallback(async () => {
    setIsModalOpen(true);
    setIsScanning(true);
    const foundDevices = await scanDevices();
    setDevices(foundDevices);
    setIsScanning(false);
  }, [scanDevices]);

  const handleConnect = useCallback(
    async (port: string) => {
      await connectToDevice(port);
      setIsModalOpen(false);
    },
    [connectToDevice],
  );

  // Upload — sends code to Link GUI for preview, then user uploads from there
  const handleUpload = useCallback(() => {
    const code = generatedCodeRef.current;
    if (!code.trim()) {
      addLog("No code to upload. Add some blocks first.", "error");
      return;
    }
    // Send to Link GUI for preview
    sendCodeToLink(code);
    addLog("Code sent to Link GUI for preview", "info");
  }, [sendCodeToLink, addLog]);

  // Run Code — one-click: convert blocks → C++ → upload directly
  const handleRunCode = useCallback(() => {
    const code = generatedCodeRef.current;
    if (!code.trim()) {
      addLog("No code to run. Add some blocks first.", "error");
      return;
    }
    sendCodeToLink(code); // Also update Link GUI display
    uploadCode(code); // Start compile + upload immediately
  }, [uploadCode, sendCodeToLink, addLog]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        connectedPort={connectedPort}
        onConnectLink={connectToLink}
        onDisconnectLink={disconnectFromLink}
        onOpenDeviceModal={handleOpenConnectModal}
        onDisconnectDevice={disconnectDevice}
        onUpload={handleUpload}
        onRunCode={handleRunCode}
      />

      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
        isScanning={isScanning}
        devices={devices}
        scanDevices={handleOpenConnectModal}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left: Blockly Editor */}
        <div className="flex-1 relative bg-white dark:bg-gray-800 transition-colors duration-200">
          <BlocklyEditor themeMode={theme} onCodeChange={handleCodeChange} />

          {/* Floating Console Toggle (if closed) */}
          {!isConsoleOpen && (
            <button
              onClick={() => setIsConsoleOpen(true)}
              className="absolute bottom-6 right-6 p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg z-20 transition-transform hover:scale-105"
              title="Open Console"
            >
              <Terminal className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Right: Console/Logs Panel */}
        <div
          className={`${isConsoleOpen ? "w-80 md:w-96" : "w-0"} transition-all duration-300 ease-in-out overflow-hidden h-full z-10`}
        >
          <ConsolePanel
            logs={logs}
            isOpen={isConsoleOpen}
            onClose={() => setIsConsoleOpen(false)}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
