import { boardManager } from '../utils/boardManager.js';
import { MESSAGE_TYPES, ERROR_CODES, COMMANDS } from '../config/constants.js';
import five from 'johnny-five';

const { Servo } = five;

// Digital Write Handler
export const handleDigitalWrite = (ws, pin, value) => {
    try {
        const board = boardManager.getBoard();
        board.pinMode(pin, board.MODES.OUTPUT);
        board.digitalWrite(pin, value);

        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ACK,
            action: COMMANDS.DIGITAL_WRITE,
            pin,
            value,
            ok: true
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.DIGITAL_WRITE_FAILED,
            message: error.message
        }));
    }
};

// Digital Read Handler
export const handleDigitalRead = (ws, pin) => {
    try {
        const board = boardManager.getBoard();
        board.pinMode(pin, board.MODES.INPUT);

        board.digitalRead(pin, (value) => {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.RESPONSE,
                action: COMMANDS.DIGITAL_READ,
                pin,
                value
            }));
        });
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.DIGITAL_READ_FAILED,
            message: error.message
        }));
    }
};

// Analog Write Handler
export const handleAnalogWrite = (ws, pin, value) => {
    try {
        const board = boardManager.getBoard();
        board.pinMode(pin, board.MODES.PWM);
        board.analogWrite(pin, value);

        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ACK,
            action: COMMANDS.ANALOG_WRITE,
            pin,
            value,
            ok: true
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.ANALOG_WRITE_FAILED,
            message: error.message
        }));
    }
};

// Analog Read Handler
export const handleAnalogRead = (ws, pin) => {
    try {
        const board = boardManager.getBoard();
        board.pinMode(pin, board.MODES.ANALOG);

        board.analogRead(pin, (value) => {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.RESPONSE,
                action: COMMANDS.ANALOG_READ,
                pin,
                value
            }));
        });
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.ANALOG_READ_FAILED,
            message: error.message
        }));
    }
};

// Servo Write Handler
export const handleServoWrite = (ws, pin, angle) => {
    try {
        const servo = new Servo(pin);
        servo.to(angle);

        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ACK,
            action: COMMANDS.SERVO_WRITE,
            pin,
            angle,
            ok: true
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.SERVO_WRITE_FAILED,
            message: error.message
        }));
    }
};

// Start Stream Handler
export const handleStartStream = (ws, pin, interval = 100) => {
    try {
        // Stop existing stream if any
        boardManager.removeStream(pin);

        const board = boardManager.getBoard();
        board.pinMode(pin, board.MODES.ANALOG);

        const streamId = setInterval(() => {
            board.analogRead(pin, (value) => {
                ws.send(JSON.stringify({
                    type: MESSAGE_TYPES.STREAM,
                    pin,
                    value,
                    timestamp: Date.now()
                }));
            });
        }, interval);

        boardManager.addStream(pin, streamId);

        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ACK,
            action: COMMANDS.START_STREAM,
            pin,
            interval,
            ok: true
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.STREAM_START_FAILED,
            message: error.message
        }));
    }
};

// Stop Stream Handler
export const handleStopStream = (ws, pin) => {
    try {
        if (boardManager.removeStream(pin)) {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.ACK,
                action: COMMANDS.STOP_STREAM,
                pin,
                ok: true
            }));
        } else {
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.ERROR,
                code: ERROR_CODES.NO_ACTIVE_STREAM,
                message: `No active stream for pin ${pin}`
            }));
        }
    } catch (error) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.STREAM_STOP_FAILED,
            message: error.message
        }));
    }
};
