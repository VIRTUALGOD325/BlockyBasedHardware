export interface HardwareMessage {
  type: string;
  requestID?: string;
  requestId?: string; // Handle both casings just in case
  action?: string;
  pin?: number | string;
  value?: number;
  message?: string;
  ok?: boolean;
  angle?: number;
}

export interface SensorData {
  pin: number | string;
  value: number;
}

export class HardwareConnection extends EventTarget {
  private url: string;
  private ws: WebSocket | null;
  public connected: boolean;
  private pendingReq: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
      timeOut: NodeJS.Timeout;
    }
  >;
  private reconnectInterval: number;
  private reconnectTimer: NodeJS.Timeout | null;

  constructor(url = "ws://localhost:8765") {
    super();
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.pendingReq = new Map();
    this.reconnectInterval = 3000;
    this.reconnectTimer = null;
  }

  connect() {
    // Prevent multiple connections
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
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.dispatchEvent(new CustomEvent("DISCONNECTED"));
      this.ws = null;

      // Auto Reconnect
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, this.reconnectInterval);
      }
    };

    this.ws.onerror = (error) => {
      // WebSocket error event doesn't contain data to parse
      this.dispatchEvent(new CustomEvent("ERROR", { detail: error }));
    };
  }

  handleMessage(msg: HardwareMessage) {
    if (msg.type === "ack" || msg.type === "error" || msg.type === "ERROR") {
      const reqId = msg.requestID || msg.requestId;
      if (!reqId) return;

      const pending = this.pendingReq.get(reqId);
      if (pending) {
        clearTimeout(pending.timeOut);
        this.pendingReq.delete(reqId);

        if (msg.type === "ack") {
          pending.resolve(msg);
        } else {
          pending.reject(new Error(msg.message || "Unknown error"));
        }
      }
    } else if (msg.type === "stream") {
      this.dispatchEvent(
        new CustomEvent("sensorData", {
          detail: { pin: msg.pin, value: msg.value },
        }),
      );
    }
  }

  async sendCommand(
    action: string,
    pin: number | string,
    value: number | null = null,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error("Not connected to hardware bridge"));
        return;
      }

      const requestID = this.generateId();

      const command: HardwareMessage = {
        type: "cmd",
        action,
        pin,
        value: value ?? undefined, // Only send if not null
        requestID,
      };

      // Timeout Duration
      const timeOut = setTimeout(() => {
        this.pendingReq.delete(requestID);
        reject(new Error("COMMAND TIMEOUT"));
      }, 5000);

      this.pendingReq.set(requestID, { resolve, reject, timeOut });

      this.ws.send(JSON.stringify(command));
    });
  }

  async setDigitalPin(pin: number | string, value: boolean | number) {
    return this.sendCommand("digitalWrite", pin, value ? 1 : 0);
  }

  async readAnalogPin(pin: number | string) {
    const response = await this.sendCommand("analogRead", pin);
    return response.value;
  }

  async setServo(pin: number | string, angle: number) {
    return this.sendCommand("servoWrite", pin, angle);
  }

  generateId() {
    return Math.random().toString(36).substring(2, 9);
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
}
