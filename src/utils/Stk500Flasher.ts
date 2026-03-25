/**
 * STK500v1 protocol flasher for Arduino Uno (ATmega328P with optiboot).
 * Flashes compiled .hex binary via Web Serial API.
 *
 * Protocol reference: AVR061 — STK500 Communication Protocol
 */

// STK500 constants
const STK_OK = 0x10;
const STK_INSYNC = 0x14;
const CRC_EOP = 0x20; // End of packet marker

const STK_GET_SYNC = 0x30;
const STK_GET_PARAMETER = 0x41;
const STK_SET_DEVICE = 0x42;
const STK_ENTER_PROGMODE = 0x50;
const STK_LEAVE_PROGMODE = 0x51;
const STK_LOAD_ADDRESS = 0x55;
const STK_PROG_PAGE = 0x64;
const STK_READ_SIGN = 0x75;

// ATmega328P signature
const ATMEGA328P_SIG = [0x1e, 0x95, 0x0f];
const PAGE_SIZE = 128; // bytes per flash page for ATmega328P

type OnProgress = (phase: string, percent: number) => void;

export class Stk500Flasher {
  private port: SerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readBuffer: number[] = [];
  private readLoop: Promise<void> | null = null;

  constructor(port: SerialPort) {
    this.port = port;
  }

  /**
   * Flash binary data to the connected Arduino.
   * The port must NOT be open — this method opens and closes it.
   */
  async flash(binary: Uint8Array, onProgress?: OnProgress): Promise<void> {
    // Try optiboot (115200) first, then old bootloader (57600)
    const baudRates = [115200, 57600];
    let synced = false;

    for (const baud of baudRates) {
      await this.port.open({ baudRate: baud });

      try {
        this.startReading();

        // Reset the board by toggling DTR (enter bootloader)
        await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await this.delay(250);
        await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
        // Wait for bootloader to start — optiboot needs ~100ms, old bootloader longer
        await this.delay(baud === 115200 ? 150 : 500);

        // Drain any garbage from reset
        this.readBuffer = [];

        onProgress?.("sync", 0);

        // Sync with bootloader (try multiple times)
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            await this.getSync();
            synced = true;
            break;
          } catch {
            await this.delay(50);
            this.readBuffer = [];
          }
        }

        if (synced) break;
      } finally {
        if (!synced) {
          await this.stopReading();
          if (this.port.readable || this.port.writable) {
            await this.port.close();
          }
        }
      }
    }

    if (!synced) {
      throw new Error(
        "Could not sync with bootloader. Make sure the board is connected and has a compatible bootloader."
      );
    }

    try {

      onProgress?.("sync", 100);

      // Enter programming mode
      onProgress?.("program", 0);
      await this.enterProgMode();

      // Read device signature
      const sig = await this.readSignature();
      if (
        sig[0] !== ATMEGA328P_SIG[0] ||
        sig[1] !== ATMEGA328P_SIG[1] ||
        sig[2] !== ATMEGA328P_SIG[2]
      ) {
        console.warn(
          `Unexpected signature: ${sig.map((b) => b.toString(16)).join(" ")}. Proceeding anyway.`
        );
      }

      // Flash pages
      const totalPages = Math.ceil(binary.length / PAGE_SIZE);
      for (let page = 0; page < totalPages; page++) {
        const offset = page * PAGE_SIZE;
        const chunk = binary.slice(offset, offset + PAGE_SIZE);

        // Load word address (byte address / 2)
        const wordAddr = offset / 2;
        await this.loadAddress(wordAddr & 0xffff);

        // Program page
        await this.progPage(chunk);

        onProgress?.("program", Math.round(((page + 1) / totalPages) * 100));
      }

      // Leave programming mode
      await this.leaveProgMode();
      onProgress?.("done", 100);
    } finally {
      await this.stopReading();
      if (this.port.readable || this.port.writable) {
        await this.port.close();
      }
    }
  }

  // ── Protocol commands ──

  private async getSync(): Promise<void> {
    await this.send([STK_GET_SYNC, CRC_EOP]);
    await this.expectInsyncOk();
  }

  private async enterProgMode(): Promise<void> {
    await this.send([STK_ENTER_PROGMODE, CRC_EOP]);
    await this.expectInsyncOk();
  }

  private async leaveProgMode(): Promise<void> {
    await this.send([STK_LEAVE_PROGMODE, CRC_EOP]);
    await this.expectInsyncOk();
  }

  private async loadAddress(addr: number): Promise<void> {
    await this.send([STK_LOAD_ADDRESS, addr & 0xff, (addr >> 8) & 0xff, CRC_EOP]);
    await this.expectInsyncOk();
  }

  private async progPage(data: Uint8Array): Promise<void> {
    const len = data.length;
    const packet = new Uint8Array(5 + len);
    packet[0] = STK_PROG_PAGE;
    packet[1] = (len >> 8) & 0xff;
    packet[2] = len & 0xff;
    packet[3] = 0x46; // 'F' for flash memory
    packet.set(data, 4);
    packet[4 + len] = CRC_EOP;
    await this.send(Array.from(packet));
    await this.expectInsyncOk();
  }

  private async readSignature(): Promise<number[]> {
    await this.send([STK_READ_SIGN, CRC_EOP]);
    const response = await this.readBytes(5, 2000);
    // Response: INSYNC, sig1, sig2, sig3, OK
    if (response[0] !== STK_INSYNC || response[4] !== STK_OK) {
      throw new Error("Failed to read device signature");
    }
    return [response[1], response[2], response[3]];
  }

  // ── Low-level I/O ──

  private async send(data: number[]): Promise<void> {
    const writer = this.port.writable?.getWriter();
    if (!writer) throw new Error("Port not writable");
    try {
      await writer.write(new Uint8Array(data));
    } finally {
      writer.releaseLock();
    }
  }

  private async expectInsyncOk(): Promise<void> {
    const resp = await this.readBytes(2, 2000);
    if (resp[0] !== STK_INSYNC || resp[1] !== STK_OK) {
      throw new Error(
        `Expected INSYNC+OK, got: ${resp.map((b) => "0x" + b.toString(16)).join(" ")}`
      );
    }
  }

  private readBytes(count: number, timeoutMs: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;

      const check = () => {
        if (this.readBuffer.length >= count) {
          resolve(this.readBuffer.splice(0, count));
          return;
        }
        if (Date.now() > deadline) {
          reject(
            new Error(
              `Timeout waiting for ${count} bytes (got ${this.readBuffer.length})`
            )
          );
          return;
        }
        setTimeout(check, 5);
      };
      check();
    });
  }

  private startReading(): void {
    if (!this.port.readable) return;
    this.reader = this.port.readable.getReader();
    this.readLoop = (async () => {
      try {
        while (true) {
          const { value, done } = await this.reader!.read();
          if (done) break;
          if (value) {
            for (const byte of value) {
              this.readBuffer.push(byte);
            }
          }
        }
      } catch {
        // Reader cancelled — expected during cleanup
      }
    })();
  }

  private async stopReading(): Promise<void> {
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // Ignore
      }
      this.reader = null;
    }
    if (this.readLoop) {
      await this.readLoop.catch(() => {});
      this.readLoop = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
