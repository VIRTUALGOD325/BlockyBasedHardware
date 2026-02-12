# 🔧 Blockly Hardware Platform

> A visual programming environment for hardware control — built on Google Blockly and wired into the Scratch GUI extension system.
> **Current Status**: Phase 1 (Blockly Hardware IDE) - Completed

---

## 📖 Project Overview

This project lets students and makers **visually program hardware** (Arduino, Raspberry Pi, micro:bit, ESP32) using drag-and-drop block coding.

The system is designed to work in two ways:

1.  **Standalone Blockly IDE** (Current Implementation) — A dedicated workspace with hardware-specific blocks that generate code.
2.  **Scratch GUI Extension** (Future) — Embedding hardware blocks directly inside Scratch.

## ✨ Features (Phase 1)

### 🧩 Custom Hardware Blocks

We have implemented a custom toolbox with specialized categories:

- **🟦 Control**: Loops, conditionals, and timing functions.
- **🟥 GPIO**: `digital_write`, `digital_read`, `analog_write`, `analog_read`, `set_pin_mode`.
- **🟩 Sensors**: `read_ultrasonic`, `read_dht`, `read_ir`.
- **🟨 Actuators**: `set_servo_angle`, `set_motor_speed`, `set_neopixel`.

### ⚡ Arduino Code Generation

The environment generates valid **C++ Arduino code** corresponding to the visual blocks. It handles:

- Automatic library inclusions (`<Servo.h>`, `<DHT.h>`, etc.).
- `setup()` and `loop()` structure.
- Global variable declarations and pin modes.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd blocky-main
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Run the development server:

    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173` (or the port shown in your terminal).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (UI Layer)                  │
│                                                         │
│   ┌─────────────────┐       ┌─────────────────────┐     │
│   │  Blockly IDE    │       │   Scratch GUI       │     │
│   │  (Standalone)   │       │   + HW Extension    │     │
│   └────────┬────────┘       └──────────┬──────────┘     │
│            │ WebSocket / HTTP          │                │
│            ▼                           ▼                │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Core**: Google Blockly
- **Language**: JavaScript

## 🔮 Future Roadmap

- **Phase 2**: Hardware Bridge Server (Node.js/Serial communication)
- **Phase 3**: Scratch GUI Extension
- **Phase 4**: Integration & Real-time "Live Mode"
- **Phase 5**: Polish, Installers & Documentation

---

_Generated for the EduPrime Blockly Hardware Project._
