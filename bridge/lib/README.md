# Compiler Manager & Bridge Library

This directory contains the core logic for the "Integrated Toolchain" - the system that allows the web app to compile and upload code to an Arduino without an IDE.

## `CompilerManager.js`

The `CompilerManager` is a wrapper around the `arduino-cli` command-line tool. It automates the following manual steps:

1.  **Core Installation**: Ensures the `arduino:avr` core (for Uno/Nano) is installed.
2.  **Sketch Creation**: Writes the string of C++ code from the frontend into a temporary `.ino` file.
3.  **Compilation**: Runs `arduino-cli compile` to turn C++ into a machine binary (`.hex`).
4.  **Upload**: Runs `arduino-cli upload` to send that binary to the board via USB.

### Prerequisites

You must have `arduino-cli` installed and available in your system PATH.

- **Mac (Homebrew)**: `brew install arduino-cli`
- **Verify**: Run `arduino-cli version` in your terminal.

### Usage Example

```javascript
import { compilerManager } from "./CompilerManager.js";

// 1. Initialize (installs cores if missing)
await compilerManager.ensureCoreInstalled();

// 2. Compile & Upload
try {
  const result = await compilerManager.compileAndUpload(
    "void setup() { ... }",
    "/dev/tty.usbmodem14101",
  );
  console.log("Success!", result);
} catch (err) {
  console.error("Failed:", err.message);
}
```

## How it works (Under the Hood)

1.  **Temporary Files**: We use the `fs` module to create a unique folder in `os.tmpdir()` for every compilation request. This prevents collisions if two users (or two browser tabs) try to compile at once.
2.  **Child Processes**: We use Node.js `exec` (or `spawn`) to run the `arduino-cli` commands. This is exactly like typing them in the terminal, but automated.
3.  **Parsers**: We capture the `stdout` (standard output) and `stderr` (error output) from the CLI. If compilation fails, we send the confusing C++ error messages back to the frontend (eventually we could parse these to highlight blocks!).

## Troubleshooting

- **"arduino-cli not found"**: Make sure it's installed and in your PATH. You might need to specify the absolute path in `CompilerManager.js` if Node can't find it.
- **"Port busy"**: The Serial Monitor might still be connected. The `CompilerManager` logic _should_ disconnect it before uploading, but if it fails, try unplugging and replugging the board.
