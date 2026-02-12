# 🔧 Blockly Hardware Platform + Scratch GUI Integration

> A visual programming environment for hardware control — built on Google Blockly and wired into the Scratch GUI extension system.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Phase 1 — Blockly Hardware IDE](#phase-1--blockly-hardware-ide)
- [Phase 2 — Hardware Bridge Server](#phase-2--hardware-bridge-server)
- [Phase 3 — Scratch GUI Extension](#phase-3--scratch-gui-extension)
- [Phase 4 — Integration & Wiring](#phase-4--integration--wiring)
- [Phase 5 — Polish & Distribution](#phase-5--polish--distribution)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

---

## Project Overview

This project lets students and makers **visually program hardware** (Arduino, Raspberry Pi, micro:bit, ESP32) using drag-and-drop block coding — in two complementary ways:

1. **Standalone Blockly IDE** — A dedicated workspace with hardware-specific blocks that generate code or send real-time commands to a device.
2. **Scratch GUI Extension** — The same hardware blocks embedded directly inside Scratch, so learners can combine sprite logic with physical hardware in a single project.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (UI Layer)                  │
│                                                         │
│   ┌─────────────────┐       ┌─────────────────────┐    │
│   │  Blockly IDE     │       │   Scratch GUI        │   │
│   │  (Standalone)    │       │   + HW Extension     │   │
│   └────────┬────────┘       └──────────┬──────────┘    │
│            │ WebSocket / HTTP           │               │
└────────────┼────────────────────────────┼───────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│              Hardware Bridge Server (Local)             │
│         Node.js / Python · Serial · Firmata             │
└─────────────────────────────┬───────────────────────────┘
                              │ USB Serial / BLE
                              ▼
                   ┌──────────────────────┐
                   │   Hardware Device    │
                   │  Arduino / Pi / ESP  │
                   └──────────────────────┘
```

---

## Phase 1 — Blockly Hardware IDE

**Goal:** Build a working standalone Blockly workspace with custom hardware block definitions.

### 1.1 — Project Scaffold

Set up the base web application shell:

- Initialize a project with a bundler (Vite or Webpack)
- Install `blockly` as a dependency (`npm install blockly`)
- Create an `index.html` with a full-screen Blockly injection target
- Configure the Blockly toolbox with a basic default set of blocks

### 1.2 — Custom Hardware Block Definitions

Define hardware-specific blocks in JSON (Blockly's block definition format) and implement their JavaScript generators. Block categories to implement:

**GPIO / Digital**
- `set_pin_mode` — Set a pin as INPUT or OUTPUT
- `digital_write` — Write HIGH or LOW to a pin
- `digital_read` — Read the state of a digital pin

**Analog**
- `analog_write` — Write a PWM value (0–255) to a pin
- `analog_read` — Read a value (0–1023) from an analog pin

**Timing**
- `delay_ms` — Pause execution for N milliseconds
- `delay_us` — Pause for N microseconds

**Sensors (extensible)**
- `read_ultrasonic` — Read distance from HC-SR04
- `read_dht` — Read temperature and humidity from DHT11/22
- `read_ir` — Read from an IR receiver

**Actuators**
- `set_servo_angle` — Move a servo to a given angle
- `set_motor_speed` — Control a DC motor via L298N
- `set_neopixel` — Set color of an addressable LED

### 1.3 — Code Generator

Implement a code generation backend for the target platform:

- Wire each block to an Arduino C++ generator using `Blockly.Arduino = new Blockly.Generator('Arduino')`
- Define `scrub_` and `finish` methods to wrap generated code in proper `setup()` / `loop()` boilerplate
- Add a **Generate Code** button that displays the output in a syntax-highlighted panel
- Add a **Copy to Clipboard** action for the generated code

### 1.4 — Toolbox UI

Configure the toolbox XML/JSON to organize blocks into collapsible categories with color coding:

- 🟦 Control (loops, conditionals, timing)
- 🟥 GPIO
- 🟩 Sensors
- 🟨 Actuators
- 🟪 Variables & Functions

### Deliverables — Phase 1

- [ ] Blockly workspace renders in browser
- [ ] All hardware block categories are defined and draggable
- [ ] Code generator produces valid Arduino C++ from a block program
- [ ] Toolbox is organized, color-coded, and searchable

---

## Phase 2 — Hardware Bridge Server

**Goal:** Create a local server that acts as the communication layer between the browser and the physical hardware device.

### 2.1 — Server Setup

Initialize a local Node.js server using Express + `ws` (WebSocket library):

- `npm init` in a `/bridge` directory
- Install dependencies: `express`, `ws`, `serialport`, `@serialport/parser-readline`
- Create `server.js` as the entry point
- Expose a REST endpoint `GET /devices` to list available serial ports
- Expose a WebSocket endpoint `ws://localhost:8765` for real-time communication

### 2.2 — Serial Communication (Firmata)

Integrate the `johnny-five` library (or raw Firmata over `serialport`) to talk to hardware:

- Auto-detect connected Arduino/ESP boards on available COM/tty ports
- On connection, emit a `{ type: "connected", board: "..." }` event over WebSocket
- Implement command handlers for incoming messages:
  - `{ cmd: "digitalWrite", pin: 13, value: 1 }`
  - `{ cmd: "analogRead", pin: "A0" }` → responds with `{ pin: "A0", value: 512 }`
  - `{ cmd: "analogWrite", pin: 9, value: 128 }`
  - `{ cmd: "servoWrite", pin: 10, angle: 90 }`

### 2.3 — Real-time Sensor Polling

Support continuous sensor data streaming:

- Accept `{ cmd: "startStream", pin: "A0", interval: 100 }` to begin polling
- Emit `{ type: "sensorData", pin: "A0", value: 423 }` on the interval
- Accept `{ cmd: "stopStream", pin: "A0" }` to cancel

### 2.4 — Python Alternative (Raspberry Pi)

For Raspberry Pi targets, provide a Python bridge using `RPi.GPIO` and `websockets`:

- Mirror the same WebSocket message protocol as the Node.js server
- Support GPIO read/write, I2C (via `smbus2`), and SPI
- Provide a `bridge.service` systemd unit file for autostart on boot

### 2.5 — Packaging

Make the bridge easy to install and run:

- Add an `npm start` script
- Provide a `bridge.bat` / `bridge.sh` launcher
- Document port configuration via `.env` file
- Add a browser-accessible status page at `http://localhost:8765/status`

### Deliverables — Phase 2

- [ ] Bridge server starts and detects connected hardware
- [ ] Browser can send commands and receive data over WebSocket
- [ ] Sensor streaming works at configurable intervals
- [ ] Python bridge works on Raspberry Pi
- [ ] One-click launch scripts for Windows and macOS/Linux

---

## Phase 3 — Scratch GUI Extension

**Goal:** Package the hardware blocks as a first-class Scratch extension that loads inside Scratch GUI.

### 3.1 — Fork Scratch VM & GUI

Clone and set up the Scratch repositories locally:

```bash
git clone https://github.com/scratchfoundation/scratch-vm
git clone https://github.com/scratchfoundation/scratch-gui

cd scratch-vm && npm install && npm link
cd ../scratch-gui && npm install && npm link scratch-vm
```

### 3.2 — Write the Scratch Extension

Create the extension file at `scratch-vm/src/extensions/scratch3_hardware/index.js`:

**Extension metadata** — define the extension ID, name, color scheme, and menu icon:
```js
static get EXTENSION_ID() { return 'hardwareIO'; }
```

**Block definitions** — map each hardware action to a Scratch block using `getInfo()`:

- Hat block: `when [pin 2] goes [HIGH]` — triggers on pin state change
- Stack block: `set pin [13] to [HIGH ▼]`
- Stack block: `set servo [pin 10] to [90] degrees`
- Reporter block: `analog value of pin [A0]` — returns a number

**Block implementations** — connect each block to a WebSocket call to the bridge server:
```js
setDigitalPin({ PIN, VALUE }) {
  this._ws.send(JSON.stringify({ cmd: 'digitalWrite', pin: PIN, value: VALUE }));
}
```

### 3.3 — Register the Extension

Add the extension to Scratch's built-in extension registry:

- Register in `scratch-vm/src/extension-support/extension-manager.js`
- Add an entry in `scratch-gui/src/lib/libraries/extensions/index.jsx` with name, description, and icon image
- The extension will appear in Scratch's "Add Extension" modal

### 3.4 — WebSocket Client in Extension

Manage the bridge connection lifecycle inside the extension class:

- On extension load: attempt to connect to `ws://localhost:8765`
- Show a Scratch "peripheral" connection UI (green dot = connected)
- Retry connection every 3 seconds if disconnected
- Dispatch incoming sensor stream data to waiting reporter block resolvers

### 3.5 — Extension Icon & Assets

Create visual assets for the extension:

- `extension-icon.svg` — 40×40 connection block icon
- `inset-icon.svg` — small icon for the block palette header
- Follow Scratch's color guidelines for the block category (`#FF6680` suggested for hardware)

### Deliverables — Phase 3

- [ ] Extension loads inside Scratch GUI without errors
- [ ] All hardware blocks appear in Scratch's block palette
- [ ] Blocks successfully call the bridge server when run in a Scratch project
- [ ] Extension shows a connected/disconnected status indicator
- [ ] Sensor reporter blocks return live values from hardware

---

## Phase 4 — Integration & Wiring

**Goal:** Connect all three layers (Blockly IDE, Bridge Server, Scratch Extension) into a unified, working system.

### 4.1 — Shared Message Protocol

Define a single, versioned protocol spec (`protocol.md`) used by all three layers:

```json
// Command (browser → bridge)
{ "type": "cmd", "action": "digitalWrite", "pin": 13, "value": 1 }

// Response (bridge → browser)
{ "type": "ack", "action": "digitalWrite", "pin": 13, "ok": true }

// Sensor stream (bridge → browser)
{ "type": "stream", "pin": "A0", "value": 512, "ts": 1710000000 }

// Error
{ "type": "error", "code": "PIN_NOT_FOUND", "message": "Pin 99 does not exist" }
```

### 4.2 — Blockly IDE Live Mode

Add a **Live Mode** toggle to the Blockly IDE that bypasses code generation and instead executes blocks in real-time via the bridge:

- Each block's `execute` method calls the bridge WebSocket directly
- An execution cursor visually highlights the active block
- A connection indicator in the toolbar shows bridge status

### 4.3 — Unified Launcher (Optional)

Create a single launcher application (using Electron or a shell script) that:

- Starts the bridge server in the background
- Opens the Blockly IDE in a browser tab
- Opens Scratch GUI in a second browser tab
- Shows a system tray icon with connection status

### 4.4 — End-to-End Test

Write an automated integration test that validates the full chain:

1. Start bridge server in test mode (mocked serial port)
2. Load the Blockly IDE and send a `digitalWrite` block program
3. Assert the bridge receives the correct WebSocket message
4. Repeat for the Scratch extension path

### Deliverables — Phase 4

- [ ] Both Blockly and Scratch use the same bridge protocol
- [ ] Live Mode works in the Blockly IDE
- [ ] End-to-end test passes for the full chain
- [ ] System runs reliably with a single launch command

---

## Phase 5 — Polish & Distribution

**Goal:** Make the platform easy to install, use, and extend for educators, students, and makers.

### 5.1 — Hardware Board Profiles

Add selectable board profiles so users can switch targets:

- **Arduino Uno** — 14 digital pins, 6 analog pins, 6 PWM
- **Arduino Mega** — 54 digital pins, 16 analog pins
- **ESP32** — 34 GPIO, WiFi, BLE, DAC
- **micro:bit** — 25 LED matrix, accelerometer, compass, radio
- **Raspberry Pi** — 40 GPIO, I2C, SPI, UART

Each profile configures which blocks and pins are valid, preventing invalid pin assignments.

### 5.2 — Example Projects

Ship a library of starter projects in both Blockly and Scratch formats:

- **Blink** — Blink an LED on pin 13
- **Fade** — Smoothly fade an LED using PWM
- **Button** — Light an LED when a button is pressed
- **Servo Sweep** — Sweep a servo back and forth
- **Distance Alarm** — Sound a buzzer when an object is closer than 10 cm
- **Temperature Display** — Show DHT11 readings on the Scratch stage

### 5.3 — Documentation Site

Build a documentation site (using Docusaurus or similar):

- **Getting Started** guide with wiring diagrams
- **Block Reference** — every block documented with inputs, outputs, and examples
- **Project Tutorials** with step-by-step instructions
- **Troubleshooting** — common connection issues and fixes

### 5.4 — Installer & Distribution

Package the platform for zero-friction installation:

- **Windows:** NSIS installer that bundles Node.js, the bridge server, and shortcuts
- **macOS:** `.dmg` with the bridge server and browser launch scripts
- **Linux:** `.deb` / `.AppImage` package
- **Raspberry Pi:** One-line `curl | bash` install script

### 5.5 — Plugin / Extension API

Expose a public API so the community can add new hardware blocks without modifying the core:

- Define a `HardwarePlugin` interface with `getBlocks()`, `getGenerators()`, and `getBridgeHandlers()`
- Document the plugin format and publish an example plugin for a generic sensor kit
- Add a plugin loader that scans a `/plugins` directory at startup

### Deliverables — Phase 5

- [ ] All major board profiles are selectable with correct pin validation
- [ ] 6+ example projects ship with the platform
- [ ] Documentation site is live
- [ ] One-click installers work on Windows, macOS, and Linux
- [ ] Plugin API is documented with a working example plugin

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockly IDE | Google Blockly, Vite, Vanilla JS |
| Code Generator | Blockly Generator API (Arduino C++) |
| Hardware Bridge | Node.js, Express, `ws`, `serialport`, `johnny-five` |
| Pi Bridge | Python, `websockets`, `RPi.GPIO`, `smbus2` |
| Scratch Extension | scratch-vm (forked), scratch-gui (forked), React |
| Docs | Docusaurus |
| Packaging | Electron (optional launcher), NSIS, DMG |

---

## Contributing

1. Fork the repository and create a feature branch
2. Follow the shared message protocol in `protocol.md` when touching the bridge or extension
3. Add block unit tests for any new hardware blocks
4. Submit a PR with a description of what hardware the change targets

---

*Built with ❤️ for makers, students, and educators.*