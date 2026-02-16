import five from 'johnny-five';
import { MESSAGE_TYPES, ERROR_CODES } from '../config/constants.js';
import { SerialPort } from 'serialport';

const { Board } = five;

class BoardManager {
    constructor() {
        this.boardInstance = null;
        this.connectedBoard = null;
        this.activeSensorStreams = new Map();
        this.wsClients = new Set();
    }

    // Initialize board connection (Auto-connect if portName is null)
    async initialize(portName = null) {
        try {
            const options = {
                repl: false,
                debug: false
            };
            // If port is specified, use it. Otherwise, Johnny-Five auto-detects.
            if (portName) {
                options.port = portName;
            }

            this.boardInstance = new Board(options);

            this.boardInstance.on('ready', () => {
                console.log(`Board connected and ready on ${portName || 'auto-detected port'}`);
                this.connectedBoard = {
                    type: 'Arduino Uno', // TODO: Detect dynamically
                    pins: this.boardInstance.pins.length,
                    connectedAt: Date.now(),
                    port: portName // Store port info
                };

                this.broadcastToAll({
                    type: MESSAGE_TYPES.CONNECTED,
                    board: this.connectedBoard.type,
                    timestamp: Date.now()
                });
            });

            this.boardInstance.on('error', (error) => {
                console.error('Board error:', error);
                this.broadcastToAll({
                    type: MESSAGE_TYPES.ERROR,
                    code: ERROR_CODES.BOARD_ERROR,
                    message: error.message
                });
            });
        } catch (error) {
            console.error('Failed to initialize board:', error);
            throw error;
        }
    }

    // Manual connect wrapper
    async connect(portName) {
        // TODO: Handle 'mode' (Wire vs Bluetooth vs BLE) 
        // For now, Wire and Bluetooth Classic are treated the same via SerialPort path.
        if (this.isReady()) {
            await this.disconnect();
        }
        await this.initialize(portName);
    }

    // Disconnect board
    async disconnect() {
        console.log("Disconnecting board...");
        this.stopAllStreams();

        if (this.boardInstance) {
            try {
                // If board has an io instance (Firmata), try to close it
                if (this.boardInstance.io && typeof this.boardInstance.io.close === 'function') {
                    // Check if it returns a promise
                    const res = this.boardInstance.io.close();
                    if (res && typeof res.then === 'function') await res;
                }
                // Fallback: try closing the port directly if accessible and not already closed by io.close()
                else if (this.boardInstance.port && typeof this.boardInstance.port.close === 'function') {
                    await new Promise((resolve) => {
                        this.boardInstance.port.close((err) => {
                            if (err) console.error("Error closing port:", err);
                            resolve();
                        });
                    });
                }
            } catch (e) {
                console.error("Error during disconnect:", e);
            }
        }
        this.boardInstance = null;
        this.connectedBoard = null;
        console.log("Board disconnected.");
    }

    // Reconnect board
    async reconnect(portName) {
        console.log(`Reconnecting to ${portName}...`);
        // Wait a bit to ensure port is released by OS
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.initialize(portName);
    }

    // Check if board is ready
    isReady() {
        return this.boardInstance && this.boardInstance.isReady;
    }

    // Get board instance
    getBoard() {
        return this.boardInstance;
    }

    // Get connected board info
    getBoardInfo() {
        return this.connectedBoard;
    }

    // Add WebSocket client
    addClient(ws) {
        this.wsClients.add(ws);
    }

    // Remove WebSocket client
    removeClient(ws) {
        this.wsClients.delete(ws);
    }

    // Broadcast message to all connected clients
    broadcastToAll(message) {
        this.wsClients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(message));
            }
        });
    }

    // Stream management
    addStream(pin, intervalId) {
        this.activeSensorStreams.set(pin, intervalId);
    }

    removeStream(pin) {
        const intervalId = this.activeSensorStreams.get(pin);
        if (intervalId) {
            clearInterval(intervalId);
            this.activeSensorStreams.delete(pin);
            return true;
        }
        return false;
    }

    stopAllStreams() {
        this.activeSensorStreams.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.activeSensorStreams.clear();
    }

    getActiveStreamsCount() {
        return this.activeSensorStreams.size;
    }

    // Graceful shutdown
    close() {
        this.stopAllStreams();
        if (this.boardInstance) {
            this.boardInstance.close();
        }
    }

    async connectRaw(portPath) {
        this.port = new SerialPort({
            path: portPath,
            baudRate: 9600
        });
        this.port.on('data', (data) => {
            this.broadcastToAll({
                type: "serial:data",
                payload: data.toString()
            })
        })
    }

    writeToSerial(data) {
        if (this.port) this.port.write(data);
    }

}

// Singleton instance
export const boardManager = new BoardManager();
