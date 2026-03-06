import { useState, useCallback, useEffect, useRef } from "react";
import { WebSerialConnection } from "../utils/WebSerialConnection";
import { ConnectionStatus, LogMessage } from "../types";
import { SerialLine } from "../components/SerialMonitor";

const LINK_URL = "http://localhost:8990";
const BRIDGE_ENDPOINT = "/api/hardware";

export const useHardware = () => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [serialLines, setSerialLines] = useState<SerialLine[]>([]);
  const [isLinkConnected, setIsLinkConnected] = useState(false);

  // Refs
  const serialConn = useRef<WebSerialConnection | null>(null);
  const serialBufferRef = useRef<string>("");
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const baudRateRef = useRef<number>(9600);

  // Initialize Web Serial connection once
  if (!serialConn.current) {
    serialConn.current = new WebSerialConnection();
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
          setIsLinkConnected(data.status === "running");
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

  // ── Event Listeners for Web Serial ──
  useEffect(() => {
    const conn = serialConn.current;
    if (!conn) return;

    const onConnected = (e: Event) => {
      const customEvent = e as CustomEvent;
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setConnectedPort(customEvent.detail || "Serial Device");
      addLog(
        `Device connected: ${customEvent.detail || "Serial Device"}`,
        "success",
      );
    };

    const onDisconnected = () => {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setConnectedPort(null);
      addLog("Device disconnected", "info");
    };

    const onError = (e: Event) => {
      const customEvent = e as CustomEvent;
      addLog(`Serial error: ${customEvent.detail || "Unknown"}`, "error");
    };

    const flushSerialBuffer = () => {
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
    };

    const onData = (e: Event) => {
      const customEvent = e as CustomEvent;
      const raw: string = customEvent.detail ?? "";

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
  }, [addLog]);

  // --- Actions ---

  const connectToDevice = useCallback(
    async (baudRate: number = 9600) => {
      if (!WebSerialConnection.isSupported()) {
        addLog("Web Serial API not supported. Use Chrome or Edge.", "error");
        return;
      }

      baudRateRef.current = baudRate;
      addLog("Opening device picker...", "info");

      try {
        const success = await serialConn.current!.connect(baudRate);
        if (!success) {
          addLog("No device selected", "info");
        }
      } catch (e: any) {
        addLog(`Connection failed: ${e.message}`, "error");
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    },
    [addLog],
  );

  const disconnectDevice = useCallback(async () => {
    try {
      await serialConn.current?.disconnect();
    } catch (e: any) {
      addLog(`Disconnect failed: ${e.message}`, "error");
    }
  }, [addLog]);

  const sendSerialData = useCallback(
    (data: string) => {
      if (!serialConn.current?.connected) return;

      serialConn.current.write(data).catch((e) => {
        addLog(`Send failed: ${e.message}`, "error");
      });

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
    [addLog],
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
   * Execute code:
   * - If EduPrime Link is running → disconnect serial, compile+upload via Link, reconnect serial
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
        // ── EduPrime Link: full compile + upload ──
        addLog("EduPrime Link detected → Compiling & uploading...", "info");

        try {
          // 1. Release serial port for arduino-cli
          addLog("Releasing serial port for upload...", "info");
          await serialConn.current?.disconnect();
          await new Promise((r) => setTimeout(r, 500));

          // 2. Compile + upload via Link
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
          await serialConn.current?.connect(baudRateRef.current);
          setConnectionStatus(ConnectionStatus.CONNECTED);
        } catch (e: any) {
          addLog(`Upload failed: ${e.message}`, "error");
          setConnectionStatus(ConnectionStatus.ERROR);

          // Try reconnecting serial even on error
          try {
            await new Promise((r) => setTimeout(r, 1000));
            await serialConn.current?.connect(baudRateRef.current);
          } catch {
            addLog(
              "Could not reconnect serial. Click Connect Device.",
              "error",
            );
          }
        }
      } else {
        // ── No Link: compile-only via Docker bridge ──
        addLog("No EduPrime Link → Compile-only mode.", "info");

        try {
          const response = await fetch(`${BRIDGE_ENDPOINT}/upload`, {
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
    [connectedPort, isLinkConnected, addLog],
  );

  return {
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
  };
};
