import { arduinoGen, Order } from "./arduino";


arduinoGen.forBlock['delay_ms'] = function (block) {
    const ms = block.getFieldValue('TIME');
    return 'delay(' + ms + ');\n'
}

arduinoGen.forBlock['delay_us'] = function (block) {
    const us = block.getFieldValue('TIME');
    return 'delayMicroseconds(' + us + ');\n'
}

