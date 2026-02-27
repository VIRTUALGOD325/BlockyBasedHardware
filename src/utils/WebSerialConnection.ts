/**
 * WebSerialConnection — Browser-native serial communication via Web Serial API.
 * Like mBlock, connects directly to hardware from the browser — no plugin needed.
 *
 * Requirements: Chrome 89+ / Edge 89+, HTTPS or localhost.
 */

export interface WebSerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export class WebSerialConnection extends EventTarget {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private readLoopActive = false;
  private _connected = false;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  get connected(): boolean {
    return this._connected;
  }

  /** Check if the browser supports Web Serial API */
  static isSupported(): boolean {
    return "serial" in navigator;
  }

  /**
   * Open the browser-native port picker and let the user select a device.
   * Returns the selected port, or null if the user cancelled.
   */
  async requestPort(): Promise<SerialPort | null> {
    if (!WebSerialConnection.isSupported()) {
      this.dispatchEvent(
        new CustomEvent("ERROR", {
          detail: "Web Serial API not supported. Use Chrome or Edge.",
        }),
      );
      return null;
    }

    try {
      const port = await navigator.serial.requestPort();
      this.port = port;
      return port;
    } catch (e: any) {
      // User cancelled the picker — not an error
      if (e.name === "NotFoundError") {
        return null;
      }
      this.dispatchEvent(new CustomEvent("ERROR", { detail: e.message }));
      return null;
    }
  }

  /**
   * Connect to the currently selected port.
   * If no port is selected, opens the picker first.
   */
  async connect(baudRate: number = 9600): Promise<boolean> {
    try {
      if (!this.port) {
        const selectedPort = await this.requestPort();
        if (!selectedPort) return false;
      }

      await this.port!.open({ baudRate });

      this._connected = true;

      // Set up writer
      if (this.port!.writable) {
        this.writer = this.port!.writable.getWriter();
      }

      // Start reading
      this.startReading();

      // Get port info for display
      const info = this.port!.getInfo();
      const portLabel = info.usbVendorId
        ? `USB (${info.usbVendorId.toString(16)}:${info.usbProductId?.toString(16)})`
        : "Serial Device";

      this.dispatchEvent(new CustomEvent("CONNECTED", { detail: portLabel }));

      return true;
    } catch (e: any) {
      this._connected = false;
      this.dispatchEvent(new CustomEvent("ERROR", { detail: e.message }));
      return false;
    }
  }

  /**
   * Disconnect from the current serial port.
   */
  async disconnect(): Promise<void> {
    this.readLoopActive = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch {
      // Ignore reader cancel errors
    }

    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch {
      // Ignore writer release errors
    }

    try {
      if (this.port) {
        await this.port.close();
      }
    } catch {
      // Port might already be closed
    }

    this._connected = false;
    this.port = null;
    this.dispatchEvent(new CustomEvent("DISCONNECTED"));
  }

  /**
   * Write string data to the serial port.
   */
  async write(data: string): Promise<void> {
    if (!this._connected || !this.writer) {
      throw new Error("Not connected");
    }

    const encoded = this.encoder.encode(data);
    await this.writer.write(encoded);
  }

  /**
   * Start reading data from the serial port in a loop.
   * Dispatches 'DATA' events for each chunk received.
   */
  private async startReading(): Promise<void> {
    if (!this.port?.readable) return;

    this.readLoopActive = true;

    while (this.readLoopActive && this.port?.readable) {
      try {
        this.reader = this.port.readable.getReader();

        while (this.readLoopActive) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            const text = this.decoder.decode(value, { stream: true });
            this.dispatchEvent(new CustomEvent("DATA", { detail: text }));
          }
        }

        this.reader.releaseLock();
        this.reader = null;
      } catch (e: any) {
        // ReadableStream error — port was likely disconnected
        if (this.readLoopActive) {
          this.dispatchEvent(new CustomEvent("ERROR", { detail: e.message }));
          await this.disconnect();
        }
        break;
      }
    }
  }
}
