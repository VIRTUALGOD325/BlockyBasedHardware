import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { BlocklyEditor } from './components/BlocklyEditor';
import { ConsolePanel } from './components/ConsolePanel';
import { useTheme } from './hooks/useTheme';
import { ConnectionStatus, DevicePort, LogMessage } from './types';
import { Terminal } from 'lucide-react';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  // App State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [connectedDevice, setConnectedDevice] = useState<DevicePort | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  
  // Helper to add logs
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message
    }]);
  };

  // Handlers
  const handleConnect = useCallback((port: DevicePort) => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    addLog(`Initiating connection to ${port.name}...`, 'info');
    
    // Simulate connection delay
    setTimeout(() => {
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setConnectedDevice(port);
      addLog(`Successfully connected to ${port.name}`, 'success');
      addLog('Ready to upload code.', 'info');
    }, 1500);
  }, []);

  const handleDisconnect = useCallback(() => {
    if (connectedDevice) {
      addLog(`Disconnecting from ${connectedDevice.name}...`, 'info');
    }
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setConnectedDevice(null);
    setIsRunning(false);
    addLog('Device disconnected', 'error');
  }, [connectedDevice]);

  const handleRun = useCallback(() => {
    if (connectionStatus !== ConnectionStatus.CONNECTED) return;
    
    setIsRunning(true);
    addLog('Compiling blocks...', 'info');
    
    // Simulate compilation and upload
    setTimeout(() => {
      addLog('Upload started...', 'info');
    }, 800);

    setTimeout(() => {
      addLog('Upload complete! Program running...', 'success');
    }, 2000);
  }, [connectionStatus]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    addLog('Program stopped by user.', 'error');
  }, []);

  const handleCodeChange = (code: string) => {
    // We could auto-save or preview generated code here
    // console.log("Code updated:", code); 
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      
      {/* Top Navigation */}
      <Header 
        theme={theme}
        toggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onRun={handleRun}
        onStop={handleStop}
        isRunning={isRunning}
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
        <div className={`${isConsoleOpen ? 'w-80 md:w-96' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden h-full z-10`}>
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
