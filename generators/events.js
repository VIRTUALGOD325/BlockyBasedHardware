import { arduinoGen } from './arduino';

// Arduino Start — visual entry point for the program.
// Blocks connected below this hat flow into loop() via scrub_().
// Individual blocks (set_pin_mode, serial_begin, etc.) add their own
// setup code to setupCode_ automatically.
arduinoGen.forBlock['arduino_start'] = function (_block) {
    // Return empty string for this block's own code, but let scrub_()
    // process the next connected block so child blocks aren't swallowed.
    return '';
};
