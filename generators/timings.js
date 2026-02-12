import { arduinoGen, Order } from "./arduino";


arduinoGen.forBlock['delay_ms'] = function (block) {
    const ms = block.getFieldValue('MS');
    return 'delay(' + ms + ');\n'
}

arduinoGen.forBlock['delay_us'] = function (block) {
    const us = block.getFieldValue('US');
    return 'delay(' + us + ');\n'
}

