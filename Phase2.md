# Phase 2 Implementation Plan - Hardware Bridge Server

## Overview

Phase 2 creates a **local Node.js server** that acts as the communication bridge between your browser-based Blockly IDE and physical hardware devices (Arduino, ESP32, etc.). The bridge will use WebSockets for real-time bidirectional communication and the Firmata protocol for hardware control.

---

## Proposed Changes

### Bridge Server Infrastructure

#### [NEW] bridge/package.json

Initialize Node.js project with required dependencies (compatible with Node 16.x.x):

> [!IMPORTANT]
> **Node Version Requirement**: This project requires Node 16.x.x and NPM 8.x.x for Scratch compatibility.
> Verify your versions with `node -v` and `npm -v` before installation.

```json
{
  "name": "blockly-hardware-bridge",
  "version": "1.0.0",
  "description": "Hardware bridge server for Blockly Hardware Platform",
  "main": "server.js",
  "engines": {
    "node": ">=16.0.0 <17.0.0",
    "npm": ">=8.0.0 <9.0.0"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.13.0",
    "serialport": "^10.5.0",
    "johnny-five": "^2.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

---

#### [NEW] bridge/.env

Configuration file for server settings:

```
PORT=8765
WS_PORT=8765
LOG_LEVEL=info
AUTO_RECONNECT=true
```

---

#### [NEW] bridge/server.js

Main server entry point with Express and WebSocket setup:

```javascript
// PSEUDOCODE for server.js

// === IMPORTS ===
import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";
import { SerialPort } from "serialport";
import { Board } from "johnny-five";

// === CONFIGURATION ===
const PORT = process.env.PORT || 8765;
const app = express();
const server = createHTTPServer(app);
const wss = new WebSocketServer({ server });

// === STATE MANAGEMENT ===
let boardInstance = null;
let connectedBoard = null;
let activeSensorStreams = new Map(); // Map<pin, intervalId>

// === EXPRESS ENDPOINTS ===

// Enable CORS for browser access
app.use(cors());
app.use(express.json());

// GET /devices - List all available serial ports
app.get("/devices", async (req, res) => {
  try {
    const ports = await SerialPort.list();
    const filteredPorts = ports.filter((port) => {
      // Filter for Arduino/ESP devices
      return (
        port.manufacturer?.includes("Arduino") ||
        port.manufacturer?.includes("FTDI") ||
        port.manufacturer?.includes("Silicon Labs")
      );
    });

    res.json({
      success: true,
      devices: filteredPorts.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer,
        vendorId: port.vendorId,
        productId: port.productId,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /status - Check server and board status
app.get("/status", (req, res) => {
  res.json({
    serverRunning: true,
    boardConnected: connectedBoard !== null,
    boardType: connectedBoard?.type || null,
    activeStreams: activeSensorStreams.size,
  });
});

// === WEBSOCKET CONNECTION HANDLING ===

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  // Send current connection status to new client
  if (connectedBoard) {
    ws.send(
      JSON.stringify({
        type: "connected",
        board: connectedBoard.type,
        timestamp: Date.now(),
      }),
    );
  }

  // Handle incoming messages from browser
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      handleCommand(ws, message);
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          code: "PARSE_ERROR",
          message: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    // Clean up any active streams for this client
    stopAllStreams();
  });
});

// === BOARD CONNECTION ===

function initializeBoard() {
  try {
    boardInstance = new Board({
      repl: false,
      debug: false,
    });

    boardInstance.on("ready", () => {
      console.log("Board connected and ready");
      connectedBoard = {
        type: "Arduino Uno", // Detect dynamically in production
        pins: boardInstance.pins.length,
        connectedAt: Date.now(),
      };

      // Broadcast connection status to all clients
      broadcastToAll({
        type: "connected",
        board: connectedBoard.type,
        timestamp: Date.now(),
      });
    });

    boardInstance.on("error", (error) => {
      console.error("Board error:", error);
      broadcastToAll({
        type: "error",
        code: "BOARD_ERROR",
        message: error.message,
      });
    });
  } catch (error) {
    console.error("Failed to initialize board:", error);
  }
}

// === COMMAND HANDLERS ===

function handleCommand(ws, message) {
  if (!boardInstance || !boardInstance.isReady) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "BOARD_NOT_READY",
        message: "Hardware board is not connected",
      }),
    );
    return;
  }

  const { cmd, pin, value, angle, interval } = message;

  switch (cmd) {
    case "digitalWrite":
      handleDigitalWrite(ws, pin, value);
      break;

    case "digitalRead":
      handleDigitalRead(ws, pin);
      break;

    case "analogWrite":
      handleAnalogWrite(ws, pin, value);
      break;

    case "analogRead":
      handleAnalogRead(ws, pin);
      break;

    case "servoWrite":
      handleServoWrite(ws, pin, angle);
      break;

    case "startStream":
      handleStartStream(ws, pin, interval);
      break;

    case "stopStream":
      handleStopStream(ws, pin);
      break;

    default:
      ws.send(
        JSON.stringify({
          type: "error",
          code: "UNKNOWN_COMMAND",
          message: `Unknown command: ${cmd}`,
        }),
      );
  }
}

// === DIGITAL I/O ===

function handleDigitalWrite(ws, pin, value) {
  try {
    // Set pin mode if not already set
    boardInstance.pinMode(pin, boardInstance.MODES.OUTPUT);

    // Write digital value (0 or 1)
    boardInstance.digitalWrite(pin, value);

    // Send acknowledgment
    ws.send(
      JSON.stringify({
        type: "ack",
        action: "digitalWrite",
        pin: pin,
        value: value,
        ok: true,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "DIGITAL_WRITE_FAILED",
        message: error.message,
      }),
    );
  }
}

function handleDigitalRead(ws, pin) {
  try {
    // Set pin mode if not already set
    boardInstance.pinMode(pin, boardInstance.MODES.INPUT);

    // Read digital value
    boardInstance.digitalRead(pin, (value) => {
      ws.send(
        JSON.stringify({
          type: "response",
          action: "digitalRead",
          pin: pin,
          value: value,
        }),
      );
    });
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "DIGITAL_READ_FAILED",
        message: error.message,
      }),
    );
  }
}

// === ANALOG I/O ===

function handleAnalogWrite(ws, pin, value) {
  try {
    // Set pin mode to PWM
    boardInstance.pinMode(pin, boardInstance.MODES.PWM);

    // Write PWM value (0-255)
    boardInstance.analogWrite(pin, value);

    ws.send(
      JSON.stringify({
        type: "ack",
        action: "analogWrite",
        pin: pin,
        value: value,
        ok: true,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "ANALOG_WRITE_FAILED",
        message: error.message,
      }),
    );
  }
}

function handleAnalogRead(ws, pin) {
  try {
    // Set pin mode to analog input
    boardInstance.pinMode(pin, boardInstance.MODES.ANALOG);

    // Read analog value (0-1023 for Arduino)
    boardInstance.analogRead(pin, (value) => {
      ws.send(
        JSON.stringify({
          type: "response",
          action: "analogRead",
          pin: pin,
          value: value,
        }),
      );
    });
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "ANALOG_READ_FAILED",
        message: error.message,
      }),
    );
  }
}

// === SERVO CONTROL ===

function handleServoWrite(ws, pin, angle) {
  try {
    // Create servo instance if doesn't exist
    const servo = new five.Servo(pin);

    // Set servo angle (0-180)
    servo.to(angle);

    ws.send(
      JSON.stringify({
        type: "ack",
        action: "servoWrite",
        pin: pin,
        angle: angle,
        ok: true,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "SERVO_WRITE_FAILED",
        message: error.message,
      }),
    );
  }
}

// === SENSOR STREAMING ===

function handleStartStream(ws, pin, interval = 100) {
  try {
    // Stop existing stream for this pin if any
    if (activeSensorStreams.has(pin)) {
      clearInterval(activeSensorStreams.get(pin));
    }

    // Set pin mode to analog input
    boardInstance.pinMode(pin, boardInstance.MODES.ANALOG);

    // Start polling at specified interval
    const streamId = setInterval(() => {
      boardInstance.analogRead(pin, (value) => {
        ws.send(
          JSON.stringify({
            type: "stream",
            pin: pin,
            value: value,
            timestamp: Date.now(),
          }),
        );
      });
    }, interval);

    // Store stream ID for cleanup
    activeSensorStreams.set(pin, streamId);

    ws.send(
      JSON.stringify({
        type: "ack",
        action: "startStream",
        pin: pin,
        interval: interval,
        ok: true,
      }),
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "STREAM_START_FAILED",
        message: error.message,
      }),
    );
  }
}

function handleStopStream(ws, pin) {
  try {
    if (activeSensorStreams.has(pin)) {
      clearInterval(activeSensorStreams.get(pin));
      activeSensorStreams.delete(pin);

      ws.send(
        JSON.stringify({
          type: "ack",
          action: "stopStream",
          pin: pin,
          ok: true,
        }),
      );
    } else {
      ws.send(
        JSON.stringify({
          type: "error",
          code: "NO_ACTIVE_STREAM",
          message: `No active stream for pin ${pin}`,
        }),
      );
    }
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "STREAM_STOP_FAILED",
        message: error.message,
      }),
    );
  }
}

function stopAllStreams() {
  activeSensorStreams.forEach((intervalId) => {
    clearInterval(intervalId);
  });
  activeSensorStreams.clear();
}

// === UTILITY FUNCTIONS ===

function broadcastToAll(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// === SERVER STARTUP ===

server.listen(PORT, () => {
  console.log(`Bridge server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log("Attempting to connect to hardware board...");

  // Initialize board connection
  initializeBoard();
});

// === GRACEFUL SHUTDOWN ===

process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  stopAllStreams();
  if (boardInstance) {
    boardInstance.close();
  }
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
```

---

#### [NEW] bridge/protocol.md

Documentation of the WebSocket message protocol:

````markdown
# Hardware Bridge Protocol v1.0

## Message Format

All messages are JSON objects sent over WebSocket.

### Browser → Bridge (Commands)

**Digital Write**

```json
{
  "cmd": "digitalWrite",
  "pin": 13,
  "value": 1
}
```
````

**Digital Read**

```json
{
  "cmd": "digitalRead",
  "pin": 2
}
```

**Analog Write (PWM)**

```json
{
  "cmd": "analogWrite",
  "pin": 9,
  "value": 128
}
```

**Analog Read**

```json
{
  "cmd": "analogRead",
  "pin": "A0"
}
```

**Servo Control**

```json
{
  "cmd": "servoWrite",
  "pin": 10,
  "angle": 90
}
```

**Start Sensor Stream**

```json
{
  "cmd": "startStream",
  "pin": "A0",
  "interval": 100
}
```

**Stop Sensor Stream**

```json
{
  "cmd": "stopStream",
  "pin": "A0"
}
```

### Bridge → Browser (Responses)

**Connection Status**

```json
{
  "type": "connected",
  "board": "Arduino Uno",
  "timestamp": 1710000000000
}
```

**Acknowledgment**

```json
{
  "type": "ack",
  "action": "digitalWrite",
  "pin": 13,
  "ok": true
}
```

**Read Response**

```json
{
  "type": "response",
  "action": "analogRead",
  "pin": "A0",
  "value": 512
}
```

**Sensor Stream Data**

```json
{
  "type": "stream",
  "pin": "A0",
  "value": 512,
  "timestamp": 1710000000000
}
```

**Error**

```json
{
  "type": "error",
  "code": "BOARD_NOT_READY",
  "message": "Hardware board is not connected"
}
```

## Error Codes

- `PARSE_ERROR` - Invalid JSON received
- `BOARD_NOT_READY` - Board not connected or not initialized
- `UNKNOWN_COMMAND` - Command not recognized
- `DIGITAL_WRITE_FAILED` - Failed to write digital value
- `DIGITAL_READ_FAILED` - Failed to read digital value
- `ANALOG_WRITE_FAILED` - Failed to write PWM value
- `ANALOG_READ_FAILED` - Failed to read analog value
- `SERVO_WRITE_FAILED` - Failed to control servo
- `STREAM_START_FAILED` - Failed to start sensor stream
- `STREAM_STOP_FAILED` - Failed to stop sensor stream
- `NO_ACTIVE_STREAM` - No active stream for specified pin

````

---

#### [NEW] bridge/README.md

Setup and usage instructions:

```markdown
# Hardware Bridge Server

Local server that bridges browser-based Blockly IDE with physical hardware devices.

## Prerequisites

- **Node.js 16.x.x** and **NPM 8.x.x** (required for Scratch compatibility)
- Arduino board with StandardFirmata uploaded
- USB connection to Arduino

### Verify Node/NPM Versions

```bash
node -v   # Should show v16.x.x
npm -v    # Should show 8.x.x
```

If you need to install Node 16, use [nvm](https://github.com/nvm-sh/nvm):
```bash
nvm install 16
nvm use 16
```

## Quick Start

1. **Install Dependencies**
   ```bash
   cd bridge
   npm install
   ```

2. **Upload Firmata to Arduino**
   - Open Arduino IDE
   - File → Examples → Firmata → StandardFirmata
   - Upload to your board

3. **Start the Bridge**

   ```bash
   npm start
   ```

4. **Verify Connection**
   - Visit http://localhost:8765/status
   - Should show `"boardConnected": true`

## API Endpoints

- `GET /devices` - List available serial ports
- `GET /status` - Check server and board status
- `ws://localhost:8765` - WebSocket connection for commands

## Troubleshooting

**Node version mismatch:**
- Use `nvm use 16` to switch to Node 16
- Run `npm install` again after switching versions

**Board not detected:**

- Ensure Arduino is plugged in via USB
- Check that StandardFirmata is uploaded
- Try different USB port
- Check permissions (Linux: add user to dialout group)

**Connection refused:**

- Verify port 8765 is not in use
- Check firewall settings
````

---

### Browser Integration

#### [MODIFY] src/App.jsx

Add WebSocket connection to communicate with bridge server:

```javascript
// Add WebSocket state and connection handling

const [ws, setWs] = useState(null);
const [bridgeConnected, setBridgeConnected] = useState(false);

// Connect to bridge server on mount
useEffect(() => {
  const websocket = new WebSocket("ws://localhost:8765");

  websocket.onopen = () => {
    console.log("Connected to hardware bridge");
    setBridgeConnected(true);
  };

  websocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("Bridge message:", message);

    if (message.type === "connected") {
      alert(`Hardware connected: ${message.board}`);
    }
  };

  websocket.onerror = (error) => {
    console.error("Bridge connection error:", error);
    setBridgeConnected(false);
  };

  websocket.onclose = () => {
    console.log("Disconnected from bridge");
    setBridgeConnected(false);
  };

  setWs(websocket);

  return () => {
    websocket.close();
  };
}, []);

// Add live execution mode
const handleLiveExecute = () => {
  if (!ws || !bridgeConnected) {
    alert("Bridge not connected!");
    return;
  }

  // Example: Blink LED on pin 13
  ws.send(
    JSON.stringify({
      cmd: "digitalWrite",
      pin: 13,
      value: 1,
    }),
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        cmd: "digitalWrite",
        pin: 13,
        value: 0,
      }),
    );
  }, 1000);
};

// Add connection status indicator to UI
// Add "Live Execute" button alongside "Generate Code"
```

---

## Verification Plan

### Automated Tests

1. **Server Startup Test**

   ```bash
   npm start
   # Verify server starts without errors
   # Check http://localhost:8765/status responds
   ```

2. **Device Detection Test**
   ```bash
   curl http://localhost:8765/devices
   # Should list connected Arduino
   ```

### Manual Verification

1. **Physical Hardware Test**
   - Connect Arduino with StandardFirmata uploaded
   - Start bridge server
   - Open browser console in Blockly app
   - Send digitalWrite command via WebSocket
   - Verify LED on Arduino responds

2. **Sensor Streaming Test**
   - Connect potentiometer to A0
   - Send startStream command
   - Verify continuous sensor data in browser console
   - Turn potentiometer and observe value changes
   - Send stopStream and verify data stops

3. **Error Handling Test**
   - Disconnect Arduino while bridge running
   - Verify error messages are sent to browser
   - Reconnect Arduino and verify auto-recovery

---

## Future Enhancements (Phase 4+)

- Python bridge for Raspberry Pi
- Automatic reconnection logic
- Multiple board support
- Installer packages
- System tray application
