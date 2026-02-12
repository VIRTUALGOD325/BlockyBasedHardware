import { boardManager } from '../utils/boardManager.js';
import { MESSAGE_TYPES, ERROR_CODES, COMMANDS } from '../config/constants.js';
import * as commandHandlers from './commandHandlers.js';

// Main command router
export const handleCommand = (ws, message) => {
    if (!boardManager.isReady()) {
        ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            code: ERROR_CODES.BOARD_NOT_READY,
            message: 'Hardware board is not connected'
        }));
        return;
    }

    const { cmd, pin, value, angle, interval } = message;

    switch (cmd) {
        case COMMANDS.DIGITAL_WRITE:
            commandHandlers.handleDigitalWrite(ws, pin, value);
            break;

        case COMMANDS.DIGITAL_READ:
            commandHandlers.handleDigitalRead(ws, pin);
            break;

        case COMMANDS.ANALOG_WRITE:
            commandHandlers.handleAnalogWrite(ws, pin, value);
            break;

        case COMMANDS.ANALOG_READ:
            commandHandlers.handleAnalogRead(ws, pin);
            break;

        case COMMANDS.SERVO_WRITE:
            commandHandlers.handleServoWrite(ws, pin, angle);
            break;

        case COMMANDS.START_STREAM:
            commandHandlers.handleStartStream(ws, pin, interval);
            break;

        case COMMANDS.STOP_STREAM:
            commandHandlers.handleStopStream(ws, pin);
            break;

        default:
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.ERROR,
                code: ERROR_CODES.UNKNOWN_COMMAND,
                message: `Unknown command: ${cmd}`
            }));
    }
};
