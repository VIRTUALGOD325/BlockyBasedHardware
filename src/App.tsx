import React from "react";
import { Header } from "./components/Header";
import { BlocklyEditor } from "./components/BlocklyEditor";
import { ConsolePanel } from "./components/ConsolePanel";
import { useTheme } from "./hooks/useTheme";
import { useHardware } from "./hooks/useHardware";
import { Terminal } from "lucide-react";
import { ConnectionModal } from "./components/ConnectionModal";
import { DevicePort } from "./types";
import { useState, useCallback } from "react";

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Hardware Hook
  const {
    connectionStatus,
    logs,
    isRunning,
    connect, // This is the old auto-connect logic mostly
    disconnect,
    runCode,
    stopCode,
    scanDevices,
    connectToDevice,
  } = useHardware();

  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [devices, setDevices] = useState<DevicePort[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleCodeChange = (code: string) => {
    // We could auto-save or preview generated code here
    // console.log("Code updated:", code);
  };

  const handleOpenConnectModal = useCallback(async () => {
    setIsModalOpen(true);
    setIsScanning(true);
    const foundkwDevices = await scanDevices();
    // Map API response to DevicePort type if needed, but api returns matching structure mostly
    setDevices(foundkwDevices);
    setIsScanning(false);
  }, [scanDevices]);

  const handleConnect = useCallback(
    async (port: string, mode: "WIRE" | "BT" | "BLE") => {
      await connectToDevice(port, mode);
      setIsModalOpen(false);
    },
    [connectToDevice],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        onConnect={handleOpenConnectModal} // Open modal instead of auto-connect
        onDisconnect={disconnect}
        onRun={() => runCode("TODO: Get Block Code")} // We need to get the code from editor
        onStop={stopCode}
        isRunning={isRunning}
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
