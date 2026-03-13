# EduPrime Link

EduPrime Link is a standalone local background service and web interface that acts as a middleware between web-based educational tools (like the EduPrime block-based programming environment) and physical hardware devices (like Arduino).

It facilitates communication using **WebSockets** and **Serial Port** connections, completely running within the browser rather than a dedicated desktop wrapper like Electron.

## Application Specifications / Requirements

### Core Requirements

- **Local HTTP Server**: Must serve the Link GUI (Automation Station) locally on port `8990`.
- **WebSocket Server**: Must run a broadcase WebSocket server on port `8991` (`127.0.0.1` locally) to transmit serial read/write events and sketch compilation progress.
- **Hardware Integration**: Must be able to scan for local USB serial ports, connect to selected ports at configurable baud rates, and manage disconnects cleanly.
- **Code Compilation & Upload**: Must leverage the `arduino-cli` to compile C++ sketches into binaries and flash them to the connected hardware directly from the web interface.
- **Integrated IDE**: Provides an embedded Monaco Editor window inside the browser UI to allow for direct C++ modifications right before compilation.

### Prerequisites (System Requirements)

- **Node.js** (v16 or higher)
- **NPM** (Node Package Manager)
- **Arduino CLI** (Must be installed and added to your system PATH for compilation features to work)

## Technologies Stack

- **Node.js**: The core runtime environment running the background processes.
- **Express.js**: Used for creating the lightweight local HTTP server that serves the frontend GUI.
- **ws**: A robust WebSocket library for Node.js, used to create the two-way event bridge on port `8991`.
- **serialport**: A Node.js package providing access to the serial ports for hardware communication.
- **Monaco Editor**: The powerful code editor that powers VS Code, embedded directly into the browser application for C++ editing.
- **Tailwind CSS**: Utility-first CSS framework used via CDN to style the "Automation Station" web interface with a modern, dark-mode aesthetic.
- **Arduino CLI**: A command-line tool used natively by the background process sequentially compile and flash `.ino` sketches to Arduino boards.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/VIRTUALGOD325/eduprime-link.git
   cd eduprime-link
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   _Note: If you encounter issues compiling the `serialport` module, ensure you have the necessary build tools (like `build-essential` on Linux or Xcode Command Line Tools on macOS) installed._

## Usage

Start the background service and web server:

```bash
npm run start
```

1. **Access the GUI**: Open a standard web browser (Chrome, Safari, Edge) and navigate to `http://localhost:8990`.
2. **Review Ports**: Select your Arduino device from the pre-populated list in the left sidebar and click **Connect**.
3. **IDE Integration**: From the main EduPrime block-coding workspace (running separately), your generated C++ code will be relayed via WebSocket and automatically populate in the EduPrime Link code editor.
4. **Compile & Upload**: Click the `Execute Script` button to begin the `arduino-cli` compilation cycle. The integrated terminal will stream logs and inform you when the upload is complete.

## Project Structure

- **`server.js`**: The HTTP entry point. Bootstraps the Express static server on port 8990 and initializes the WebSocket bridge.
- **`websocket.js`**: Runs the WebSocket server on port 8991. Listens for external events (like `SEND_CODE` or `UPLOAD_CODE`) and broadcasts them to all connected clients.
- **`ws-client.js`**: Replaces standard Electron IPC calls on the frontend to communicate with the local Node.js WebSocket server.
- **`index.html`**: The main frontend view for "Automation Station" (previously `renderer.html`).
- **`renderer.js`**: Handles the frontend UI logic (terminals, port lists, button clicks, and Monaco Editor initialization).
- **`serial.js`**: Module handling serial device discovery, reading, writing, and lifecycle management.
- **`uploader.js`**: Handles temporary sketch file generation and execution of `arduino-cli` subprocess commands.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
