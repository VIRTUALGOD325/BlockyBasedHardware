# Hardware Connection Guide for Blockly Platform

> A structured approach for implementing the Hardware Bridge Server (Phase 2) using Software Development Engineering patterns.

---

## Architecture Overview

```
┌─────────────┐      WebSocket       ┌──────────────┐      Serial/USB      ┌──────────┐
│  Browser    │ ◄──────────────────► │ Bridge Server│ ◄──────────────────► │ Arduino  │
│ (Blockly)   │   JSON protocol      │  (Node.js)   │   Firmata/Raw        │  /ESP    │
└─────────────┘                      └──────────────┘                      └──────────┘
```

---

## Step 1: Define the Message Protocol

Create a protocol specification that all layers will use.

### Protocol Types (TypeScript)

```typescript
// protocol.ts

enum MessageType {
    COMMAND = "cmd",      // Browser → Bridge
    RESPONSE = "ack",     // Bridge → Browser
    STREAM = "stream",    // Bridge → Browser (sensor data)
    ERROR = "error"       // Bridge → Browser
}

interface CommandMessage {
    type: MessageType.COMMAND
    action: "digitalWrite" | "analogRead" | "servoWrite" | "pinMode"
    pin: number | string
    value?: number
    requestId: string
}

interface ResponseMessage {
    type: MessageType.RESPONSE
    requestId: string
    ok: boolean
    value?: number
    error?: string
}

interface StreamMessage {
    type: MessageType.STREAM
    pin: string
    value: number
    timestamp: number
}
```

---

## Step 2: Bridge Server (Node.js)

### Layer 1: WebSocket Server

Handles browser connections and message routing.

```javascript
// bridge/server.js

class WebSocketManager {
    constructor(port) {
        this.clients = new Set()
        this.server = new WebSocketServer({ port })
    }
    
    onConnection(ws) {
        this.clients.add(ws)
        
        ws.on('message', (raw) => {
            const message = JSON.parse(raw)
            this.handleCommand(message, ws)
        })
        
        ws.on('close', () => {
            this.clients.delete(ws)
        })
    }
    
    broadcast(message) {
        this.clients.forEach(client => {
            client.send(JSON.stringify(message))
        })
    }
}
```

### Layer 2: Serial Connection Manager

Manages hardware board connections and command execution.

```javascript
class SerialConnectionManager {
    constructor() {
        this.boards = new Map() // port -> Board instance
        this.portFinder = new SerialPortFinder()
    }
    
    async listAvailablePorts() {
        return await this.portFinder.list()
    }
    
    async connect(portPath, baudRate = 57600) {
        // Return existing connection if available
        if (this.boards.has(portPath)) {
            return { ok: true, board: this.boards.get(portPath) }
        }
        
        // Create new board connection
        const board = new FirmataBoard(portPath, baudRate)
        await board.connect()
        
        this.boards.set(portPath, board)
        return { ok: true, board }
    }
    
    async executeCommand(board, command) {
        switch (command.action) {
            case "digitalWrite":
                return await board.digitalWrite(command.pin, command.value)
            
            case "analogRead":
                return await board.analogRead(command.pin)
            
            case "servoWrite":
                return await board.servoWrite(command.pin, command.value)
            
            default:
                throw new Error(`Unknown action: ${command.action}`)
        }
    }
}
```

### Layer 3: Main Bridge Orchestrator

Coordinates WebSocket and Serial layers.

```javascript
class HardwareBridge {
    constructor(wsPort, serialManager) {
        this.wsManager = new WebSocketManager(wsPort)
        this.serialManager = serialManager
        this.activeStreams = new Map() // pin -> intervalId
    }
    
    async handleCommand(message, client) {
        try {
            // Step 1: Parse and validate command
            const cmd = this.validateCommand(message)
            
            // Step 2: Get or create board connection
            const { board } = await this.serialManager.connect(
                cmd.port || "auto"
            )
            
            // Step 3: Execute command on hardware
            const result = await this.serialManager.executeCommand(board, cmd)
            
            // Step 4: Send success response
            client.send(JSON.stringify({
                type: "ack",
                requestId: cmd.requestId,
                ok: true,
                value: result
            }))
            
        } catch (error) {
            // Send error response
            client.send(JSON.stringify({
                type: "error",
                requestId: message.requestId,
                code: error.code,
                message: error.message
            }))
        }
    }
    
    // Sensor streaming with polling
    startStream(pin, intervalMs, board) {
        if (this.activeStreams.has(pin)) return
        
        const intervalId = setInterval(async () => {
            const value = await board.analogRead(pin)
            
            this.wsManager.broadcast({
                type: "stream",
                pin: pin,
                value: value,
                timestamp: Date.now()
            })
        }, intervalMs)
        
        this.activeStreams.set(pin, intervalId)
    }
    
    stopStream(pin) {
        const intervalId = this.activeStreams.get(pin)
        if (intervalId) {
            clearInterval(intervalId)
            this.activeStreams.delete(pin)
        }
    }
}

// Entry point
const bridge = new HardwareBridge(8765, new SerialConnectionManager())
bridge.start()
```

---

## Step 3: Firmata Board Abstraction

Encapsulates low-level hardware communication.

```javascript
// bridge/board.js

class FirmataBoard {
    constructor(portPath, baudRate) {
        this.portPath = portPath
        this.baudRate = baudRate
        this.firmata = null
        this.ready = false
        this.pinModes = new Map() // Cache pin modes
    }
    
    async connect() {
        this.serialPort = new SerialPort({
            path: this.portPath,
            baudRate: this.baudRate
        })
        
        this.firmata = new Firmata(this.serialPort)
        
        return new Promise((resolve, reject) => {
            this.firmata.on("ready", () => {
                this.ready = true
                resolve()
            })
            
            this.firmata.on("error", reject)
            
            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error("Board connection timeout"))
            }, 10000)
        })
    }
    
    async digitalWrite(pin, value) {
        this.ensurePinMode(pin, "OUTPUT")
        this.firmata.digitalWrite(pin, value)
        
        return { pin, value, mode: "digitalWrite" }
    }
    
    async analogRead(pin) {
        this.ensurePinMode(pin, "ANALOG")
        
        return new Promise((resolve) => {
            this.firmata.analogRead(pin, (value) => {
                resolve(value)
            })
        })
    }
    
    async servoWrite(pin, angle) {
        this.firmata.servoWrite(pin, angle)
        return { pin, angle }
    }
    
    // Prevent redundant pinMode calls
    ensurePinMode(pin, mode) {
        const currentMode = this.pinModes.get(pin)
        if (currentMode !== mode) {
            this.firmata.pinMode(pin, this.firmata.MODES[mode])
            this.pinModes.set(pin, mode)
        }
    }
    
    disconnect() {
        this.serialPort.close()
        this.ready = false
    }
}
```

---

## Step 4: Browser Client (WebSocket)

Frontend connection manager for Blockly IDE.

```javascript
// src/bridge/HardwareConnection.js

class HardwareConnection extends EventTarget {
    constructor(url = "ws://localhost:8765") {
        super()
        this.url = url
        this.ws = null
        this.connected = false
        this.pendingRequests = new Map() // requestId -> { resolve, reject, timeout }
        this.reconnectInterval = 3000
    }
    
    connect() {
        this.ws = new WebSocket(this.url)
        
        this.ws.onopen = () => {
            this.connected = true
            this.dispatchEvent(new CustomEvent("connected"))
        }
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
        }
        
        this.ws.onclose = () => {
            this.connected = false
            this.dispatchEvent(new CustomEvent("disconnected"))
            // Auto-reconnect
            setTimeout(() => this.connect(), this.reconnectInterval)
        }
        
        this.ws.onerror = (error) => {
            this.dispatchEvent(new CustomEvent("error", { detail: error }))
        }
    }
    
    /**
     * Command Pattern: Send command and wait for acknowledgment
     */
    async sendCommand(action, pin, value = null) {
        return new Promise((resolve, reject) => {
            const requestId = this.generateId()
            
            const command = {
                type: "cmd",
                action,
                pin,
                value,
                requestId
            }
            
            // Set up timeout
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId)
                reject(new Error("Command timeout"))
            }, 5000)
            
            this.pendingRequests.set(requestId, {
                resolve, reject, timeout
            })
            
            this.ws.send(JSON.stringify(command))
        })
    }
    
    handleMessage(message) {
        // Handle acknowledgments and errors
        if (message.type === "ack" || message.type === "error") {
            const pending = this.pendingRequests.get(message.requestId)
            
            if (pending) {
                clearTimeout(pending.timeout)
                this.pendingRequests.delete(message.requestId)
                
                if (message.type === "ack") {
                    pending.resolve(message)
                } else {
                    pending.reject(new Error(message.message))
                }
            }
        }
        // Handle sensor stream data
        else if (message.type === "stream") {
            this.dispatchEvent(new CustomEvent("sensorData", {
                detail: { pin: message.pin, value: message.value }
            }))
        }
    }
    
    // High-level API for Blockly blocks
    async setDigitalPin(pin, value) {
        return this.sendCommand("digitalWrite", pin, value ? 1 : 0)
    }
    
    async readAnalogPin(pin) {
        const response = await this.sendCommand("analogRead", pin)
        return response.value
    }
    
    async setServo(pin, angle) {
        return this.sendCommand("servoWrite", pin, angle)
    }
    
    generateId() {
        return Math.random().toString(36).substring(2, 9)
    }
}
```

---

## Step 5: Error Handling & Resilience

### Error Classes

```javascript
// bridge/errors.js

class HardwareError extends Error {
    constructor(code, message, details = {}) {
        super(message)
        this.code = code
        this.details = details
    }
}

const ErrorCodes = {
    BOARD_NOT_FOUND: "BOARD_NOT_FOUND",
    PORT_BUSY: "PORT_BUSY",
    PIN_INVALID: "PIN_INVALID",
    COMMAND_TIMEOUT: "COMMAND_TIMEOUT",
    FIRMWARE_MISMATCH: "FIRMWARE_MISMATCH"
}
```

### Retry with Exponential Backoff

```javascript
/**
 * Execute command with automatic retry for transient failures
 */
async executeWithRetry(command, maxRetries = 3) {
    let lastError
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await this.executeCommand(command)
        } catch (error) {
            lastError = error
            
            // Only retry on transient errors
            if (!this.isTransientError(error)) {
                throw error
            }
            
            // Exponential backoff: 100ms, 200ms, 400ms
            await this.delay(100 * Math.pow(2, attempt))
        }
    }
    
    throw new HardwareError(
        ErrorCodes.COMMAND_TIMEOUT,
        `Failed after ${maxRetries} attempts`,
        { originalError: lastError.message }
    )
}

isTransientError(error) {
    const transientCodes = [
        ErrorCodes.PORT_BUSY,
        ErrorCodes.COMMAND_TIMEOUT
    ]
    return transientCodes.includes(error.code)
}

delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
```

---

## Key SDE Patterns Used

| Pattern | Where Applied | Purpose |
|---------|---------------|---------|
| **Layered Architecture** | WS → Bridge → Serial → Hardware | Separation of concerns, testability |
| **Command Pattern** | `sendCommand()` method | Encapsulate requests as objects |
| **Observer Pattern** | EventTarget for connection state | Decouple state change notifications |
| **Retry with Backoff** | `executeWithRetry()` | Handle transient failures gracefully |
| **State Machine** | Connection lifecycle | Manage complex state transitions |
| **Request-Response Correlation** | `requestId` matching | Match async responses to requests |
| **Cache/Memoization** | Pin mode caching | Avoid redundant operations |

---

## Directory Structure

```
/bridge
├── server.js              # Main entry point
├── package.json           # Dependencies: express, ws, serialport, firmata
├── lib/
│   ├── WebSocketManager.js
│   ├── SerialConnectionManager.js
│   ├── HardwareBridge.js
│   └── errors.js
└── board/
    └── FirmataBoard.js

/src/bridge
└── HardwareConnection.js  # Browser-side client
```

---

## Implementation Checklist

- [ ] Define protocol types and message format
- [ ] Implement WebSocket server with connection management
- [ ] Add serial port detection and auto-connect
- [ ] Create Firmata board abstraction layer
- [ ] Build command execution pipeline
- [ ] Implement request-response correlation
- [ ] Add sensor streaming with start/stop
- [ ] Create browser client with auto-reconnect
- [ ] Add error handling with retry logic
- [ ] Write integration tests with mocked serial

---

*Generated for practicing Software Development Engineering patterns.*
