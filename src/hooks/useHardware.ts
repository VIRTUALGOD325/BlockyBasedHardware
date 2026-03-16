import { useState, useCallback, useEffect, useRef } from "react";
import { WebSerialConnection } from "../utils/WebSerialConnection";
import {
  HardwareConnection,
  SerialPortInfo,
} from "../utils/HardwareConnection";
import { ConnectionStatus, LogMessage } from "../types";
import { SerialLine } from "../components/SerialMonitor";

const LINK_URL = "http://localhost:8990";
const LINK_WS_URL = "ws://localhost:8991";

export type SerialMode = "link" | "webserial";

export const useHardware = () => {
  // ── Serial mode state ──
  const isWebSerialSupported = WebSerialConnection.isSupported();
  const [serialMode, setSerialModeRaw] = useState<SerialMode>(
    isWebSerialSupported ? "webserial" : "link",
  );

  // Only allow switching to webserial if the browser supports it
  const setSerialMode = useCallback(
    (mode: SerialMode) => {
      if (mode === "webserial" && !isWebSerialSupported) return;
      setSerialModeRaw(mode);
    },
    [isWebSerialSupported],
  );

  // ── Core state ──
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [serialLines, setSerialLines] = useState<SerialLine[]>([]);
  const [isLinkConnected, setIsLinkConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);

  // ── Refs ──
  const serialConn = useRef<WebSerialConnection | null>(null);
  const linkConn = useRef<HardwareConnection | null>(null);
  const serialBufferRef = useRef<string>("");
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const baudRateRef = useRef<number>(9600);

  // Initialize connections once
  if (!serialConn.current) {
    serialConn.current = new WebSerialConnection();
  }
  if (!linkConn.current) {
    linkConn.current = new HardwareConnection(LINK_WS_URL);
  }

  // ── Logging Helper ──
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

  // ── Serial buffer flush helper ──
  const flushSerialBuffer = useCallback(() => {
    if (serialBufferRef.current.length > 0) {
      const text = serialBufferRef.current.replace(/\r$/, "");
      serialBufferRef.current = "";
      setSerialLines((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          text,
          direction: "rx" as const,
          timestamp: new Date(),
        },
      ]);
    }
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  // ── Process incoming serial data (shared by both modes) ──
  const processSerialData = useCallback(
    (raw: string) => {
      serialBufferRef.current += raw;
      const parts = serialBufferRef.current.split("\n");
      serialBufferRef.current = parts.pop() ?? "";

      if (parts.length > 0) {
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        setSerialLines((prev) => [
          ...prev,
          ...parts.map((line) => ({
            id: Math.random().toString(36).substr(2, 9),
            text: line.replace(/\r$/, ""),
            direction: "rx" as const,
            timestamp: new Date(),
          })),
        ]);
      }

      if (serialBufferRef.current.length > 0 && !flushTimerRef.current) {
        flushTimerRef.current = setTimeout(flushSerialBuffer, 100);
      }
    },
    [flushSerialBuffer],
  );

  // ── Check if EduPrime Link is running ──
  useEffect(() => {
    let cancelled = false;

    const checkLink = async () => {
      try {
        const res = await fetch(`${LINK_URL}/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const running = data.status === "running";
          setIsLinkConnected(running);
        }
      } catch {
        if (!cancelled) setIsLinkConnected(false);
      }
    };

    checkLink();
    const interval = setInterval(checkLink, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ── Connect Link WebSocket when Link is detected ──
  useEffect(() => {
    const conn = linkConn.current;
    if (!conn) return;

    if (isLinkConnected) {
      conn.connect();
    }

    return () => {
      // Don't disconnect on cleanup — let auto-reconnect handle it
    };
  }, [isLinkConnected]);

  // ── Event listeners for Link WebSocket ──
  useEffect(() => {
    const conn = linkConn.current;
    if (!conn) return;

    const onSerialData = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (serialMode === "link") {
        processSerialData(customEvent.detail ?? "");
      }
    };

    const onPortConnected = (e: Event) => {
      if (serialMode === "link") {
        const customEvent = e as CustomEvent;
        setConnectionStatus(ConnectionStatus.CONNECTED);
        setConnectedPort(customEvent.detail || "Serial Device");
        addLog(
          `Device connected via Link: ${customEvent.detail || "Serial Device"}`,
          "success",
        );
      }
    };

    const onPortDisconnected = () => {
      if (serialMode === "link") {
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        setConnectedPort(null);
        addLog("Device disconnected (Link)", "info");
      }
    };

    const onLinkError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(`Link error: ${customEvent.detail || "Unknown"}`, "error");
    };

    conn.addEventListener("SERIAL_DATA", onSerialData as EventListener);
    conn.addEventListener("PORT_CONNECTED", onPortConnected as EventListener);
    conn.addEventListener(
      "PORT_DISCONNECTED",
      onPortDisconnected as EventListener,
    );
    conn.addEventListener("LINK_ERROR", onLinkError as EventListener);

    return () => {
      conn.removeEventListener("SERIAL_DATA", onSerialData as EventListener);
      conn.removeEventListener(
        "PORT_CONNECTED",
        onPortConnected as EventListener,
      );
      conn.removeEventListener(
        "PORT_DISCONNECTED",
        onPortDisconnected as EventListener,
      );
      conn.removeEventListener("LINK_ERROR", onLinkError as EventListener);
    };
  }, [serialMode, addLog, processSerialData]);

  // ── Event listeners for WebSerial ──
  useEffect(() => {
    const conn = serialConn.current;
    if (!conn) return;

    const onConnected = (e: Event) => {
      if (serialMode === "webserial") {
        const customEvent = e as CustomEvent;
        setConnectionStatus(ConnectionStatus.CONNECTED);
        setConnectedPort(customEvent.detail || "Serial Device");
        addLog(
          `Device connected: ${customEvent.detail || "Serial Device"}`,
          "success",
        );
      }
    };

    const onDisconnected = () => {
      if (serialMode === "webserial") {
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
        setConnectedPort(null);
        addLog("Device disconnected", "info");
      }
    };

    const onError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(`Serial error: ${customEvent.detail || "Unknown"}`, "error");
    };

    const onData = (e: Event) => {
      if (serialMode === "webserial") {
        const customEvent = e as CustomEvent;
        processSerialData(customEvent.detail ?? "");
      }
    };

    conn.addEventListener("CONNECTED", onConnected as EventListener);
    conn.addEventListener("DISCONNECTED", onDisconnected as EventListener);
    conn.addEventListener("ERROR", onError as EventListener);
    conn.addEventListener("DATA", onData as EventListener);

    return () => {
      conn.removeEventListener("CONNECTED", onConnected as EventListener);
      conn.removeEventListener("DISCONNECTED", onDisconnected as EventListener);
      conn.removeEventListener("ERROR", onError as EventListener);
      conn.removeEventListener("DATA", onData as EventListener);
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [serialMode, addLog, processSerialData]);

  // ── Refresh available ports from Link (HTTP API — always works if Link is up) ──
  const refreshPorts = useCallback(async () => {
    if (!isLinkConnected) {
      setAvailablePorts([]);
      return;
    }
    try {
      const res = await fetch(`${LINK_URL}/api/devices`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // The /api/devices endpoint returns { success: true, devices: [...] }
      setAvailablePorts(
        (data.devices || []).map((d: any) => ({
          path: d.path,
          manufacturer: d.manufacturer,
          vendorId: d.vendorId,
          productId: d.productId,
        })),
      );
    } catch (e: any) {
      addLog(`Failed to list ports: ${e.message}`, "error");
      setAvailablePorts([]);
    }
  }, [isLinkConnected, addLog]);

  // Auto-refresh ports when Link connects or mode changes to link
  useEffect(() => {
    if (serialMode === "link" && isLinkConnected) {
      // Small delay to let WS connect
      const timer = setTimeout(refreshPorts, 500);
      return () => clearTimeout(timer);
    }
  }, [serialMode, isLinkConnected, refreshPorts]);

  // ── Actions ──

  /**
   * Connect to a device.
   * - Link mode: connect via WebSocket (portPath required)
   * - WebSerial mode: opens browser picker
   */
  const connectToDevice = useCallback(
    async (baudRateOrPort?: number | string, baudRate?: number) => {
      baudRateRef.current =
        baudRate ??
        (typeof baudRateOrPort === "number" ? baudRateOrPort : 9600);

      if (serialMode === "link") {
        // Link mode — connect via WebSocket
        const portPath =
          typeof baudRateOrPort === "string" ? baudRateOrPort : undefined;
        if (!isLinkConnected || !linkConn.current?.connected) {
          addLog("EduPrime Link is not running. Start Link first.", "error");
          return;
        }
        if (!portPath) {
          addLog("Select a port from the dropdown.", "error");
          return;
        }
        addLog(`Connecting to ${portPath} via Link...`, "info");
        try {
          await linkConn.current.connectPort(portPath, baudRateRef.current);
        } catch (e: any) {
          addLog(`Connection failed: ${e.message}`, "error");
          setConnectionStatus(ConnectionStatus.ERROR);
        }
      } else {
        // WebSerial mode — browser picker
        if (!WebSerialConnection.isSupported()) {
          addLog("Web Serial API not supported. Switch to Link mode.", "error");
          return;
        }
        addLog("Opening device picker...", "info");
        try {
          const success = await serialConn.current!.connect(
            baudRateRef.current,
          );
          if (!success) {
            addLog("No device selected", "info");
          }
        } catch (e: any) {
          addLog(`Connection failed: ${e.message}`, "error");
          setConnectionStatus(ConnectionStatus.ERROR);
        }
      }
    },
    [serialMode, isLinkConnected, addLog],
  );

  const disconnectDevice = useCallback(async () => {
    try {
      if (serialMode === "link") {
        await linkConn.current?.disconnectPort();
      } else {
        await serialConn.current?.disconnect();
      }
    } catch (e: any) {
      addLog(`Disconnect failed: ${e.message}`, "error");
    }
  }, [serialMode, addLog]);

  const sendSerialData = useCallback(
    (data: string) => {
      if (serialMode === "link") {
        if (!linkConn.current?.connected) return;
        linkConn.current.sendData(data);
      } else {
        if (!serialConn.current?.connected) return;
        serialConn.current.write(data).catch((e) => {
          addLog(`Send failed: ${e.message}`, "error");
        });
      }

      setSerialLines((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: data.replace(/[\r\n]+$/, ""),
          direction: "tx" as const,
          timestamp: new Date(),
        },
      ]);
    },
    [serialMode, addLog],
  );

  const clearSerialLines = useCallback(() => {
    setSerialLines([]);
    serialBufferRef.current = "";
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  /**
   * Upload code:
   * - If Link is running → compile+upload via Link HTTP API
   * - If no Link → compile-only via Docker bridge
   */
  const uploadCode = useCallback(
    async (code: string) => {
      if (!connectedPort) {
        addLog("No device connected", "error");
        return;
      }

      setConnectionStatus(ConnectionStatus.UPLOADING);

      if (isLinkConnected) {
        addLog("EduPrime Link detected → Compiling & uploading...", "info");

        try {
          // 1. Release serial port for arduino-cli
          addLog("Releasing serial port for upload...", "info");
          if (serialMode === "link") {
            await linkConn.current?.disconnectPort();
          } else {
            await serialConn.current?.disconnect();
          }
          await new Promise((r) => setTimeout(r, 500));

          // 2. Compile + upload via Link HTTP API
          const response = await fetch(`${LINK_URL}/api/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, port: connectedPort }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Upload failed (${response.status})`,
            );
          }

          const result = await response.json();
          addLog(result.message || "Upload successful!", "success");

          // 3. Reconnect serial
          addLog("Reconnecting serial monitor...", "info");
          await new Promise((r) => setTimeout(r, 1500));
          if (serialMode === "link") {
            await linkConn.current?.connectPort(
              connectedPort,
              baudRateRef.current,
            );
          } else {
            await serialConn.current?.connect(baudRateRef.current);
          }
          setConnectionStatus(ConnectionStatus.CONNECTED);
        } catch (e: any) {
          addLog(`Upload failed: ${e.message}`, "error");
          setConnectionStatus(ConnectionStatus.ERROR);

          // Try reconnecting serial even on error
          try {
            await new Promise((r) => setTimeout(r, 1000));
            if (serialMode === "link") {
              await linkConn.current?.connectPort(
                connectedPort,
                baudRateRef.current,
              );
            } else {
              await serialConn.current?.connect(baudRateRef.current);
            }
          } catch {
            addLog(
              "Could not reconnect serial. Click Connect Device.",
              "error",
            );
          }
        }
      } else {
        // No Link: compile-only via Docker bridge
        addLog("No EduPrime Link → Compile-only mode.", "info");

        try {
          const response = await fetch(`/api/hardware/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, port: connectedPort }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Compile failed (${response.status})`,
            );
          }

          const result = await response.json();
          addLog(
            result.message ||
              "Compiled! Install EduPrime Link to upload to device.",
            "success",
          );
          setConnectionStatus(ConnectionStatus.CONNECTED);
        } catch (e: any) {
          addLog(`Compile failed: ${e.message}`, "error");
          setConnectionStatus(ConnectionStatus.ERROR);
        }
      }
    },
    [connectedPort, isLinkConnected, serialMode, addLog],
  );

  return {
    // State
    connectionStatus,
    connectedPort,
    logs,
    serialLines,
    isLinkConnected,
    availablePorts,
    // Serial mode
    serialMode,
    setSerialMode,
    isWebSerialSupported,
    // Actions
    connectToDevice,
    disconnectDevice,
    uploadCode,
    sendSerialData,
    clearSerialLines,
    refreshPorts,
    addLog,
  };
};
