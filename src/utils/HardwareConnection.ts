export interface LinkMessage {
  type: string;
  requestId?: string;
  data?: any;
  port?: string;
  code?: string;
  status?: string;
  message?: string;
}

export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
}

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeOut: NodeJS.Timeout;
};

/**
 * HardwareConnection — WebSocket client for the Eduprime-Link (Electron app).
 * Handles: port listing, connect/disconnect, compile/upload, serial data.
 */
export class HardwareConnection extends EventTarget {
  private url: string;
  private ws: WebSocket | null;
  public connected: boolean;
  private pendingReq: Map<string, PendingRequest>;
  private reconnectTimer: NodeJS.Timeout | null;
  private reconnectAttempts: number;
  private shouldReconnect: boolean;

  // Reconnect config
  private static readonly BASE_RECONNECT_MS = 1000;
  private static readonly MAX_RECONNECT_MS = 15000;
  private static readonly MAX_RECONNECT_ATTEMPTS = 50;

  constructor(url = "ws://localhost:8990") {
    super();
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.pendingReq = new Map();
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.dispatchEvent(new CustomEvent("CONNECTED"));
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: LinkMessage = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    this.ws.onclose = () => {
      const wasConnected = this.connected;
      this.connected = false;
      this.ws = null;

      // Reject all pending requests — the connection is gone
      this.rejectAllPending("Connection to EduPrime-Link lost");

      if (wasConnected) {
        this.dispatchEvent(new CustomEvent("DISCONNECTED"));
      }

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this, so we just log/dispatch
      this.dispatchEvent(
        new CustomEvent("ERROR", {
          detail: "WebSocket connection error",
        }),
      );
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (
      this.reconnectAttempts >= HardwareConnection.MAX_RECONNECT_ATTEMPTS
    ) {
      this.dispatchEvent(
        new CustomEvent("LINK_ERROR", {
          detail: "Max reconnection attempts reached. Click to retry.",
        }),
      );
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      HardwareConnection.BASE_RECONNECT_MS *
        Math.pow(1.5, this.reconnectAttempts) +
        Math.random() * 500,
      HardwareConnection.MAX_RECONNECT_MS,
    );

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(msg: LinkMessage) {
    const { type, requestId } = msg;

    switch (type) {
      case "READY":
        this.dispatchEvent(new CustomEvent("READY"));
        break;

      case "PORTS": {
        if (requestId) this.resolveRequest(requestId, msg.data);
        break;
      }

      case "CONNECTED": {
        if (requestId) this.resolveRequest(requestId, msg);
        this.dispatchEvent(
          new CustomEvent("PORT_CONNECTED", { detail: msg.port }),
        );
        break;
      }

      case "DISCONNECTED": {
        if (requestId) this.resolveRequest(requestId, msg);
        this.dispatchEvent(
          new CustomEvent("PORT_DISCONNECTED", {
            detail: msg.message,
          }),
        );
        break;
      }

      case "SERIAL_DATA": {
        this.dispatchEvent(
          new CustomEvent("SERIAL_DATA", { detail: msg.data }),
        );
        break;
      }

      case "COMPILE_STATUS": {
        this.dispatchEvent(
          new CustomEvent("COMPILE_STATUS", {
            detail: { status: msg.status, message: msg.message },
          }),
        );
        break;
      }

      case "UPLOAD_STATUS": {
        // Resolve the upload request only on final states
        if (msg.status === "done" || msg.status === "error") {
          if (requestId) {
            if (msg.status === "done") {
              this.resolveRequest(requestId, msg);
            } else {
              this.rejectRequest(
                requestId,
                new Error(msg.message || "Upload failed"),
              );
            }
          }
        }
        this.dispatchEvent(
          new CustomEvent("UPLOAD_STATUS", {
            detail: { status: msg.status, message: msg.message },
          }),
        );
        break;
      }

      case "PONG": {
        if (requestId) this.resolveRequest(requestId, msg);
        break;
      }

      case "ERROR": {
        if (requestId) {
          this.rejectRequest(
            requestId,
            new Error(msg.message || "Unknown error"),
          );
        }
        this.dispatchEvent(
          new CustomEvent("LINK_ERROR", { detail: msg.message }),
        );
        break;
      }
    }
  }

  // --- Public API ---

  /** List available serial ports */
  async listPorts(): Promise<SerialPortInfo[]> {
    return this.sendRequest("LIST_PORTS");
  }

  /** Connect to a serial port */
  async connectPort(port: string, baudRate: number = 9600): Promise<any> {
    return this.sendRequest("CONNECT", { port, baudRate });
  }

  /** Disconnect from current serial port */
  async disconnectPort(): Promise<any> {
    return this.sendRequest("DISCONNECT");
  }

  /** Compile and upload C++ code */
  async uploadCode(code: string, port: string): Promise<any> {
    return this.sendRequest("UPLOAD_CODE", { code, port }, 60000);
  }

  /** Send raw serial data */
  sendData(data: string) {
    this.sendRaw({ type: "SEND_DATA", payload: data });
  }

  /** Send generated C++ code for display in the Link GUI */
  sendCode(code: string) {
    this.sendRaw({ type: "SEND_CODE", code });
  }

  /** Check if the WebSocket connection is alive */
  async ping(): Promise<boolean> {
    try {
      await this.sendRequest("PING", {}, 3000);
      return true;
    } catch {
      return false;
    }
  }

  /** Reset reconnect counter and retry immediately */
  retryConnect() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    // Close any stale socket before retrying
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    this.connect();
  }

  /** Wait for the WebSocket to be connected, with a timeout */
  waitForConnection(timeoutMs = 5000): Promise<boolean> {
    if (this.connected) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => { cleanup(); resolve(false); }, timeoutMs);
      const onConnect = () => { cleanup(); resolve(true); };
      const onError = () => { cleanup(); resolve(false); };
      const cleanup = () => {
        clearTimeout(timeout);
        this.removeEventListener("CONNECTED", onConnect);
        this.removeEventListener("ERROR", onError);
      };
      this.addEventListener("CONNECTED", onConnect, { once: true });
      this.addEventListener("ERROR", onError, { once: true });
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending("Connection closed");
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  // --- Internal helpers ---

  private sendRequest(
    type: string,
    payload: Record<string, any> = {},
    timeout = 10000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error("Not connected to EduPrime-Link"));
        return;
      }

      const requestId = this.generateId();

      const timeOut = setTimeout(() => {
        this.pendingReq.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      this.pendingReq.set(requestId, { resolve, reject, timeOut });

      try {
        this.ws.send(JSON.stringify({ type, requestId, ...payload }));
      } catch (e: any) {
        clearTimeout(timeOut);
        this.pendingReq.delete(requestId);
        reject(new Error(`Failed to send: ${e.message}`));
      }
    });
  }

  private sendRaw(data: Record<string, any>) {
    if (this.connected && this.ws) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch {
        // Connection may have dropped between check and send
      }
    }
  }

  private resolveRequest(requestId: string, value: any) {
    const pending = this.pendingReq.get(requestId);
    if (pending) {
      clearTimeout(pending.timeOut);
      this.pendingReq.delete(requestId);
      pending.resolve(value);
    }
  }

  private rejectRequest(requestId: string, error: Error) {
    const pending = this.pendingReq.get(requestId);
    if (pending) {
      clearTimeout(pending.timeOut);
      this.pendingReq.delete(requestId);
      pending.reject(error);
    }
  }

  private rejectAllPending(reason: string) {
    for (const [id, pending] of this.pendingReq) {
      clearTimeout(pending.timeOut);
      pending.reject(new Error(reason));
    }
    this.pendingReq.clear();
  }

  private generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
}
