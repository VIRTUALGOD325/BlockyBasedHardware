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
  const [sensorValues, setSensorValues] = useState<Record<string, number>>({});

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
      addLog("Hardware bridge connected", "success");
      addLog("Ready to upload code.", "info");
    };

    const onDisconnected = () => {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setConnectedDevice(null);
      setIsRunning(false);
      setSensorValues({}); // Reset sensors
      addLog("Hardware bridge disconnected", "error");
    };

    const onError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(
        `Connection error: ${JSON.stringify(customEvent.detail)}`,
        "error",
      );
    };

    const onSensorData = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { pin, value } = customEvent.detail;
      setSensorValues((prev) => ({ ...prev, [pin]: value }));
    };

    connection.addEventListener("CONNECTED", onConnected as EventListener);
    connection.addEventListener(
      "DISCONNECTED",
      onDisconnected as EventListener,
    );
    connection.addEventListener("ERROR", onError as EventListener);
    connection.addEventListener("sensorData", onSensorData as EventListener);

    return () => {
      connection.removeEventListener("CONNECTED", onConnected as EventListener);
      connection.removeEventListener(
        "DISCONNECTED",
        onDisconnected as EventListener,
      );
      connection.removeEventListener("ERROR", onError as EventListener);
      connection.removeEventListener(
        "sensorData",
        onSensorData as EventListener,
      );
    };
  }, [addLog]);

  const monitorPin = useCallback(
    async (pin: string | number) => {
      if (!hwConnection.current) return;
      try {
        await hwConnection.current.startStream(pin, 100); // Default 100ms
        addLog(`Started monitoring pin ${pin}`, "info");
      } catch (e: any) {
        addLog(`Failed to monitor pin ${pin}: ${e.message}`, "error");
      }
    },
    [addLog],
  );

  const stopMonitor = useCallback(
    async (pin: string | number) => {
      if (!hwConnection.current) return;
      try {
        await hwConnection.current.stopStream(pin);
        addLog(`Stopped monitoring pin ${pin}`, "info");
      } catch (e: any) {
        addLog(`Failed to stop monitoring pin ${pin}: ${e.message}`, "error");
      }
    },
    [addLog],
  );

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

  const uploadCode = useCallback(
    async (code: string) => {
      if (!connectedDevice) {
        addLog("No device connected", "error");
        return;
      }

      setConnectionStatus(ConnectionStatus.UPLOADING);
      try {
        // Call our new API
        const response = await fetch("http://localhost:8765/api/upload", {
          method: "POST",
          body: JSON.stringify({ code, port: connectedDevice.id }),
        });

        if (!response.ok) throw new Error("Upload Failed");

        addLog("Upload Successful!", "success");
        setConnectionStatus(ConnectionStatus.CONNECTED);
      } catch (e: any) {
        addLog(`Error: ${e.message}`, "error");
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    },
    [connectedDevice, addLog],
  );

  const scanDevices = useCallback(async () => {
    try {
      // Add a small buffer so the UI "Scanning..." state is visible
      const [response] = await Promise.all([
        fetch("http://localhost:8765/api/devices"),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      const data = await response.json();
      if (data.success) {
        return data.devices;
      }
      return [];
    } catch (e) {
      addLog(`Scan failed: ${e}`, "error");
      return [];
    }
  }, [addLog]);

  const connectToDevice = useCallback(
    async (port: string, mode: "WIRE" | "BT" | "BLE") => {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      addLog(`Connecting to ${port} via ${mode}...`, "info");

      try {
        const response = await fetch("http://localhost:8765/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ port, mode }),
        });
        const data = await response.json();

        if (data.success) {
          // The socket connection will confirm the 'CONNECTED' status
          // We just wait for the event
        } else {
          throw new Error(data.error);
        }
      } catch (e: any) {
        addLog(`Connection failed: ${e.message}`, "error");
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    },
    [addLog],
  );

  return {
    connectionStatus,
    connectedDevice,
    logs,
    isRunning,
    sensorValues, // Export sensor values
    connect,
    disconnect,
    runCode,
    stopCode,
    uploadCode,
    monitorPin, // Export monitor function
    stopMonitor, // Export stop monitor function
    addLog,
    scanDevices, // New
    connectToDevice, // New
  };
};
