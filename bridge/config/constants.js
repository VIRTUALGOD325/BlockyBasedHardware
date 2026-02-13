// Bridge server configuration
export const config = {
    port: process.env.PORT || 8765,
    wsPort: process.env.WS_PORT || 8765,
    logLevel: process.env.LOG_LEVEL || 'info',
    autoReconnect: process.env.AUTO_RECONNECT === 'true'
};

// Error codes
export const ERROR_CODES = {
    PARSE_ERROR: 'PARSE_ERROR',
    BOARD_NOT_READY: 'BOARD_NOT_READY',
    UNKNOWN_COMMAND: 'UNKNOWN_COMMAND',
    DIGITAL_WRITE_FAILED: 'DIGITAL_WRITE_FAILED',
    DIGITAL_READ_FAILED: 'DIGITAL_READ_FAILED',
    ANALOG_WRITE_FAILED: 'ANALOG_WRITE_FAILED',
    ANALOG_READ_FAILED: 'ANALOG_READ_FAILED',
    SERVO_WRITE_FAILED: 'SERVO_WRITE_FAILED',
    STREAM_START_FAILED: 'STREAM_START_FAILED',
    STREAM_STOP_FAILED: 'STREAM_STOP_FAILED',
    NO_ACTIVE_STREAM: 'NO_ACTIVE_STREAM',
    BOARD_ERROR: 'BOARD_ERROR'
};

// Message types
export const MESSAGE_TYPES = {
    CONNECTED: 'connected',
    ERROR: 'error',
    ACK: 'ack',
    RESPONSE: 'response',
    STREAM: 'stream'
};

// Commands
export const COMMANDS = {
    DIGITAL_WRITE: 'digitalWrite',
    DIGITAL_READ: 'digitalRead',
    ANALOG_WRITE: 'analogWrite',
    ANALOG_READ: 'analogRead',
    SERVO_WRITE: 'servoWrite',
    START_STREAM: 'startStream',
    STOP_STREAM: 'stopStream'
};
