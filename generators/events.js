import { arduinoGen } from './arduino';

// Arduino Start — visual entry point for the program.
// Blocks connected below flow into loop(). Individual blocks (set_pin_mode,
// serial_begin, etc.) add their own setup code to setupCode_ automatically.
arduinoGen.forBlock['arduino_start'] = function (_block) {
    return '';
};
