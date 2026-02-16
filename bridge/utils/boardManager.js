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

    // Initialize board connection
    async initialize() {
        try {
            this.boardInstance = new Board({
                repl: false,
                debug: false
            });

            this.boardInstance.on('ready', () => {
                console.log('Board connected and ready');
                this.connectedBoard = {
                    type: 'Arduino Uno', // TODO: Detect dynamically
                    pins: this.boardInstance.pins.length,
                    connectedAt: Date.now()
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
