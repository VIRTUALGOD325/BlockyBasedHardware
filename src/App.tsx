import React from "react";
import { Header } from "./components/Header";
import { BlocklyEditor } from "./components/BlocklyEditor";
import { BoardPanel } from "./components/BoardPanel";
import { SerialMonitor } from "./components/SerialMonitor";
import { CodePreviewPanel } from "./components/CodePreviewPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { AuthPage } from "./components/AuthPage";
import { StatusToast, UploadProgressBar } from "./components/StatusToast";
import { useTheme } from "./hooks/useTheme";
import { useHardware } from "./hooks/useHardware";
import { useSettings } from "./hooks/useSettings";
import { useAuth } from "./hooks/useAuth";
import { useProject } from "./hooks/useProject";
import {
  Activity,
  ChevronUp,
  ChevronDown,
  Monitor,
  Undo2,
  Redo2,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";

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
    uploadProgress,
  } = useHardware();

  const { settings, updateSetting, resetSettings } = useSettings();
  const { user, isAuthenticated, isLoading: authLoading, error: authError, login, register, logout, clearError } = useAuth();
  const { projectName, setProjectName, hasUnsavedChanges, markChanged, saveToFile, loadFromFile, newProject, setWorkspace, undo, redo } = useProject();

  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Store generated code for upload and code preview
  const generatedCodeRef = useRef<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  // Width of Blockly's toolbox category list, measured after init
  const [toolboxCatWidth, setToolboxCatWidth] = useState(0);

  const handleCodeChange = (code: string) => {
    generatedCodeRef.current = code;
    setGeneratedCode(code);
    markChanged();
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
        isSerialMonitorOpen={isBottomPanelOpen}
        onToggleSerialMonitor={() => setIsBottomPanelOpen((v) => !v)}
        isCodePanelOpen={isCodePanelOpen}
        onToggleCodePanel={() => setIsCodePanelOpen((v) => !v)}
        serialMode={serialMode}
        onSetSerialMode={setSerialMode}
        isWebSerialSupported={isWebSerialSupported}
        availablePorts={availablePorts}
        onRefreshPorts={refreshPorts}
        // Settings
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((v) => !v)}
        // Project
        projectName={projectName}
        hasUnsavedChanges={hasUnsavedChanges}
        onRenameProject={setProjectName}
        // Auth
        user={user}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={logout}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Area: Blockly + Code Preview + Settings */}
        <div className="flex-1 flex overflow-hidden">
          {/* Blockly Editor — full width; board panel lives inside as an overlay */}
          <div className="flex-1 relative bg-white dark:bg-[#141620] transition-colors duration-200">
            <BlocklyEditor
              themeMode={theme}
              onCodeChange={handleCodeChange}
              onWorkspaceReady={setWorkspace}
              onToolboxWidthReady={setToolboxCatWidth}
            />

            {/* Board Panel — sits below the toolbox category list */}
            {toolboxCatWidth > 0 && (
              <div
                className="absolute bottom-0 left-0 z-30"
                style={{ width: toolboxCatWidth }}
              >
                <BoardPanel
                  connectionStatus={connectionStatus}
                  connectedPort={connectedPort}
                />
              </div>
            )}

            {/* Undo / Redo floating buttons */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
              <button
                onClick={undo}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={redo}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-lg bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-all"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
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

          {/* Right Side: Settings Panel */}
          <div
            className={`${
              isSettingsOpen ? "w-72 md:w-80" : "w-0"
            } transition-all duration-300 ease-in-out overflow-hidden h-full z-10 flex flex-col`}
          >
            {isSettingsOpen && (
              <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onUpdateSetting={updateSetting}
                onResetSettings={resetSettings}
                onSave={saveToFile}
                onLoad={loadFromFile}
                onNewProject={newProject}
                serialMode={serialMode}
                onSetSerialMode={setSerialMode}
                isWebSerialSupported={isWebSerialSupported}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            )}
          </div>
        </div>

        {/* ═══ BOTTOM PANEL: Serial Monitor ═══ */}
        <div
          className="flex-shrink-0 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#1a1d27] z-20 flex flex-col transition-all duration-300"
          style={{ height: isBottomPanelOpen ? "256px" : "32px" }}
        >
          {/* Tab Bar */}
          <div
            className="h-8 flex-shrink-0 flex items-center justify-between px-3 border-b border-gray-200 dark:border-white/5"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(180deg, #1a1d27 0%, #171a24 100%)"
                  : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
            <div className="flex items-center gap-0.5">
              {/* Status indicator */}
              <div className="flex items-center gap-1.5 mr-3">
                <Activity className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Device:{" "}
                  <span className={connectedPort ? "text-emerald-500" : "text-gray-400 dark:text-gray-500"}>
                    {connectedPort ? "Active" : "Idle"}
                  </span>
                </span>
              </div>

              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Serial Monitor Tab */}
              <button
                onClick={() => setIsBottomPanelOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  isBottomPanelOpen
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

            <button
              onClick={() => setIsBottomPanelOpen((v) => !v)}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors"
            >
              {isBottomPanelOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Serial Monitor Content */}
          {isBottomPanelOpen && (
            <div className="flex-1 overflow-hidden">
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
            </div>
          )}
        </div>
      </main>

      {/* Toast notifications */}
      <StatusToast logs={logs} />

      {/* Upload progress bar — rendered over the main area, just below header */}
      <UploadProgressBar progress={uploadProgress} />

      {/* Auth Page */}
      <AuthPage
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={login}
        onRegister={register}
        error={authError}
        onClearError={clearError}
        isLoading={authLoading}
      />
    </div>
  );
};

export default App;
