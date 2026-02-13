import { useState, useCallback, useEffect, useRef } from "react";
import { HardwareConnection } from "../utils/HardwareConnection";
import { ConnectionStatus, DevicePort, LogMessage } from "../types";

export const useHardware = () => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );
  const [connectedDevice, setConnectedDevice] = useState<DevicePort | null>(
    null,
  );
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Refs
  // Use a ref for the connection instance to persist it across renders without causing re-renders
  const hwConnection = useRef<HardwareConnection | null>(null);

  // Initialize connection instance once
  if (!hwConnection.current) {
    hwConnection.current = new HardwareConnection();
  }

  // Logging Helper
  const addLog = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          type,
          message,
        },
      ]);
    },
    [],
  );

  // Event Listeners
  useEffect(() => {
    const connection = hwConnection.current;
    if (!connection) return;

    const onConnected = () => {
      setConnectionStatus(ConnectionStatus.CONNECTED);
      // Device info would ideally come from the event details or handshake
      // For now, we rely on the port passed to connect()
      addLog("Hardware bridge connected", "success");
      addLog("Ready to upload code.", "info");
    };

    const onDisconnected = () => {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setConnectedDevice(null);
      setIsRunning(false);
      addLog("Hardware bridge disconnected", "error");
    };

    const onError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(
        `Connection error: ${JSON.stringify(customEvent.detail)}`,
        "error",
      );
    };

    connection.addEventListener("CONNECTED", onConnected as EventListener);
    connection.addEventListener(
      "DISCONNECTED",
      onDisconnected as EventListener,
    );
    connection.addEventListener("ERROR", onError as EventListener);

    return () => {
      connection.removeEventListener("CONNECTED", onConnected as EventListener);
      connection.removeEventListener(
        "DISCONNECTED",
        onDisconnected as EventListener,
      );
      connection.removeEventListener("ERROR", onError as EventListener);
    };
  }, [addLog]);

  // Actions
  const connect = useCallback(
    (port: DevicePort) => {
      if (!hwConnection.current) return;

      setConnectionStatus(ConnectionStatus.CONNECTING);
      addLog(`Initiating connection to ${port.name}...`, "info");

      // Optimistically set device (verified by CONNECTED event)
      setConnectedDevice(port);

      try {
        hwConnection.current.connect();
      } catch (e) {
        addLog(`Failed to connect: ${e}`, "error");
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        setConnectedDevice(null);
      }
    },
    [addLog],
  );

  const disconnect = useCallback(() => {
    if (connectedDevice) {
      addLog(`Disconnecting from ${connectedDevice.name}...`, "info");
    }
    hwConnection.current?.disconnect();
  }, [connectedDevice, addLog]);

  const runCode = useCallback(
    async (code: string) => {
      if (
        connectionStatus !== ConnectionStatus.CONNECTED ||
        !hwConnection.current
      ) {
        addLog("Cannot run: Hardware not connected", "error");
        return;
      }

      setIsRunning(true);
      addLog("Running code...", "info");

      try {
        // Placeholder for actual code execution logic
        // In a real scenario, this would parse 'code' or execute blockly generators

        // Example test: Toggle Pin 13
        addLog("Executing logic (Test: Blink Pin 13)...", "info");
        await hwConnection.current.setDigitalPin(13, 1);

        // Simple delay demonstration
        setTimeout(async () => {
          if (hwConnection.current) {
            await hwConnection.current.setDigitalPin(13, 0);
            addLog("Execution complete.", "success");
            setIsRunning(false);
          }
        }, 1000);
      } catch (e) {
        addLog(`Execution failed: ${e}`, "error");
        setIsRunning(false);
      }
    },
    [connectionStatus, addLog],
  );

  const stopCode = useCallback(() => {
    setIsRunning(false);
    addLog("Execution stopped by user.", "error");
    // Implement actual stop command if supported by firmware
  }, [addLog]);

  return {
    connectionStatus,
    connectedDevice,
    logs,
    isRunning,
    connect,
    disconnect,
    runCode,
    stopCode,
    addLog, // Expose incase app needs to log UI events
  };
};
