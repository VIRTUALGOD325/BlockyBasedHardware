import { arduinoGen } from "./arduino";

// wait milliseconds — decimal support (e.g. 1.5 ms → 1500 µs)
arduinoGen.forBlock['delay_ms'] = function (block) {
    const ms = parseFloat(block.getFieldValue('TIME')) || 0;
    if (ms !== Math.floor(ms)) {
        return 'delayMicroseconds(' + Math.round(ms * 1000) + ');\n';
    }
    return 'delay(' + Math.round(ms) + ');\n';
};

// wait microseconds — legacy, kept for old saved files
arduinoGen.forBlock['delay_us'] = function (block) {
    const us = block.getFieldValue('TIME');
    return 'delayMicroseconds(' + us + ');\n';
};

// wait seconds — decimal seconds (0.5 = 500 ms, 0.001 = 1 ms)
arduinoGen.forBlock['wait_seconds'] = function (block) {
    const secs = parseFloat(block.getFieldValue('TIME')) || 0;
    const ms = Math.round(secs * 1000);
    if (ms < 16) {
        return 'delayMicroseconds(' + Math.round(secs * 1000000) + ');\n';
    }
    return 'delay(' + ms + ');\n';
};
