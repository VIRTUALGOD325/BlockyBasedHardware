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
  private reconnectInterval: number;
  private reconnectTimer: NodeJS.Timeout | null;

  constructor(url = "ws://localhost:8991") {
    super();
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.pendingReq = new Map();
    this.reconnectInterval = 3000;
    this.reconnectTimer = null;
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
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
      this.connected = false;
      this.dispatchEvent(new CustomEvent("DISCONNECTED"));
      this.ws = null;

      // Auto-reconnect
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, this.reconnectInterval);
      }
    };

    this.ws.onerror = (error) => {
      this.dispatchEvent(new CustomEvent("ERROR", { detail: error }));
    };
  }

  private handleMessage(msg: LinkMessage) {
    const { type, requestId } = msg;

    switch (type) {
      case "READY":
        this.dispatchEvent(new CustomEvent("READY"));
        break;

      case "PORTS": {
        // Resolve pending listPorts request
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
        this.dispatchEvent(new CustomEvent("PORT_DISCONNECTED"));
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
    return this.sendRequest("UPLOAD_CODE", { code, port }, 60000); // 60s timeout for compile+upload
  }

  /** Send raw serial data */
  sendData(data: string) {
    this.sendRaw({ type: "SEND_DATA", payload: data });
  }

  /** Send generated C++ code for display in the Link GUI */
  sendCode(code: string) {
    this.sendRaw({ type: "SEND_CODE", code });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // --- Internal helpers ---

  private sendRequest(
    type: string,
    payload: Record<string, any> = {},
    timeout = 10000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error("Not connected to Eduprime-Link"));
        return;
      }

      const requestId = this.generateId();

      const timeOut = setTimeout(() => {
        this.pendingReq.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      this.pendingReq.set(requestId, { resolve, reject, timeOut });

      this.ws.send(JSON.stringify({ type, requestId, ...payload }));
    });
  }

  private sendRaw(data: Record<string, any>) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(data));
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

  private generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
}
