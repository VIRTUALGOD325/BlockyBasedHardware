import { useState, useCallback, useEffect, useRef } from "react";
import { HardwareConnection } from "../utils/HardwareConnection";
import { ConnectionStatus, LogMessage } from "../types";

export const useHardware = () => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Refs
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

  // Event Listeners for the Link WebSocket
  useEffect(() => {
    const connection = hwConnection.current;
    if (!connection) return;

    const onConnected = () => {
      setConnectionStatus(ConnectionStatus.CONNECTED);
      addLog("Eduprime-Link connected", "success");
    };

    const onDisconnected = () => {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setConnectedPort(null);
      addLog("Eduprime-Link disconnected", "error");
    };

    const onError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(`Connection error: ${customEvent.detail || "Unknown"}`, "error");
    };

    const onReady = () => {
      addLog("Eduprime-Link ready", "success");
    };

    const onPortConnected = (e: Event) => {
      const customEvent = e as CustomEvent;
      setConnectedPort(customEvent.detail);
      addLog(`Serial port connected: ${customEvent.detail}`, "success");
    };

    const onPortDisconnected = () => {
      setConnectedPort(null);
      addLog("Serial port disconnected", "info");
    };

    const onSerialData = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(`[Serial] ${customEvent.detail}`, "info");
    };

    const onCompileStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { status, message } = customEvent.detail;
      if (status === "started") addLog(message || "Compiling...", "info");
      else if (status === "done") addLog(message || "Compile done", "success");
      else if (status === "error") addLog(message || "Compile error", "error");
    };

    const onUploadStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { status, message } = customEvent.detail;
      if (status === "started") addLog(message || "Uploading...", "info");
      else if (status === "done") {
        addLog(message || "Upload successful!", "success");
        setConnectionStatus(ConnectionStatus.CONNECTED);
      } else if (status === "error") {
        addLog(message || "Upload failed", "error");
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    };

    const onLinkError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(`Link error: ${customEvent.detail}`, "error");
    };

    connection.addEventListener("CONNECTED", onConnected as EventListener);
    connection.addEventListener(
      "DISCONNECTED",
      onDisconnected as EventListener,
    );
    connection.addEventListener("ERROR", onError as EventListener);
    connection.addEventListener("READY", onReady as EventListener);
    connection.addEventListener(
      "PORT_CONNECTED",
      onPortConnected as EventListener,
    );
    connection.addEventListener(
      "PORT_DISCONNECTED",
      onPortDisconnected as EventListener,
    );
    connection.addEventListener("SERIAL_DATA", onSerialData as EventListener);
    connection.addEventListener(
      "COMPILE_STATUS",
      onCompileStatus as EventListener,
    );
    connection.addEventListener(
      "UPLOAD_STATUS",
      onUploadStatus as EventListener,
    );
    connection.addEventListener("LINK_ERROR", onLinkError as EventListener);

    return () => {
      connection.removeEventListener("CONNECTED", onConnected as EventListener);
      connection.removeEventListener(
        "DISCONNECTED",
        onDisconnected as EventListener,
      );
      connection.removeEventListener("ERROR", onError as EventListener);
      connection.removeEventListener("READY", onReady as EventListener);
      connection.removeEventListener(
        "PORT_CONNECTED",
        onPortConnected as EventListener,
      );
      connection.removeEventListener(
        "PORT_DISCONNECTED",
        onPortDisconnected as EventListener,
      );
      connection.removeEventListener(
        "SERIAL_DATA",
        onSerialData as EventListener,
      );
      connection.removeEventListener(
        "COMPILE_STATUS",
        onCompileStatus as EventListener,
      );
      connection.removeEventListener(
        "UPLOAD_STATUS",
        onUploadStatus as EventListener,
      );
      connection.removeEventListener(
        "LINK_ERROR",
        onLinkError as EventListener,
      );
    };
  }, [addLog]);

  // Auto-connect to Link WebSocket on mount
  useEffect(() => {
    const connection = hwConnection.current;
    if (connection && !connection.connected) {
      connection.connect();
    }

    return () => {
      // Don't disconnect on cleanup — let it persist across re-renders
    };
  }, []);

  // --- Actions ---

  /** Connect to the Eduprime-Link WebSocket */
  const connectToLink = useCallback(() => {
    setConnectionStatus(ConnectionStatus.CONNECTING);
    addLog("Connecting to Eduprime-Link...", "info");
    try {
      hwConnection.current?.connect();
    } catch (e) {
      addLog(`Failed to connect: ${e}`, "error");
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [addLog]);

  /** Disconnect from the Link WebSocket */
  const disconnectFromLink = useCallback(() => {
    addLog("Disconnecting from Eduprime-Link...", "info");
    hwConnection.current?.disconnect();
  }, [addLog]);

  /** Scan for available serial ports via the Link */
  const scanDevices = useCallback(async () => {
    if (!hwConnection.current?.connected) {
      addLog("Not connected to Eduprime-Link. Connect first.", "error");
      return [];
    }

    try {
      addLog("Scanning for devices...", "info");
      const ports = await hwConnection.current.listPorts();
      addLog(`Found ${ports.length} port(s)`, "success");
      return ports;
    } catch (e: any) {
      addLog(`Scan failed: ${e.message}`, "error");
      return [];
    }
  }, [addLog]);

  /** Connect to a specific serial port through the Link */
  const connectToDevice = useCallback(
    async (port: string) => {
      if (!hwConnection.current?.connected) {
        addLog("Not connected to Eduprime-Link", "error");
        return;
      }

      addLog(`Connecting to ${port}...`, "info");
      try {
        await hwConnection.current.connectPort(port);
        setConnectedPort(port);
      } catch (e: any) {
        addLog(`Connection failed: ${e.message}`, "error");
      }
    },
    [addLog],
  );

  /** Disconnect from the current serial port */
  const disconnectDevice = useCallback(async () => {
    if (!hwConnection.current?.connected) return;
    try {
      await hwConnection.current.disconnectPort();
      setConnectedPort(null);
    } catch (e: any) {
      addLog(`Disconnect failed: ${e.message}`, "error");
    }
  }, [addLog]);

  /** Compile and upload C++ code to the connected board */
  const uploadCode = useCallback(
    async (code: string) => {
      if (!connectedPort) {
        addLog("No device connected", "error");
        return;
      }

      if (!hwConnection.current?.connected) {
        addLog("Not connected to Eduprime-Link", "error");
        return;
      }

      setConnectionStatus(ConnectionStatus.UPLOADING);
      addLog("Starting compile and upload...", "info");

      try {
        await hwConnection.current.uploadCode(code, connectedPort);
        addLog("Upload complete!", "success");
        setConnectionStatus(ConnectionStatus.CONNECTED);
      } catch (e: any) {
        addLog(`Upload failed: ${e.message}`, "error");
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    },
    [connectedPort, addLog],
  );

  /** Send generated C++ code to the Link for display in its GUI */
  const sendCodeToLink = useCallback((code: string) => {
    if (hwConnection.current?.connected) {
      hwConnection.current.sendCode(code);
    }
  }, []);

  return {
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
  };
};
