import { arduinoGen, Order } from './arduino';

// Serial.begin(baud)
arduinoGen.forBlock['serial_begin'] = function (block) {
    const baud = block.getFieldValue('BAUD');
    arduinoGen.setupCode_['serial_begin'] = 'Serial.begin(' + baud + ');';
    return '';
}

// Serial.print(value)
arduinoGen.forBlock['serial_print'] = function (block) {
    arduinoGen.setupCode_['serial_begin'] = arduinoGen.setupCode_['serial_begin'] || 'Serial.begin(9600);';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '""';
    return 'Serial.print(' + value + ');\n';
}

// Serial.println(value)
arduinoGen.forBlock['serial_println'] = function (block) {
    arduinoGen.setupCode_['serial_begin'] = arduinoGen.setupCode_['serial_begin'] || 'Serial.begin(9600);';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '""';
    return 'Serial.println(' + value + ');\n';
}

// Serial.available()
arduinoGen.forBlock['serial_available'] = function () {
    return ['Serial.available()', Order.FUNCTION_CALL];
}

// Serial.read()
arduinoGen.forBlock['serial_read'] = function () {
    return ['Serial.read()', Order.FUNCTION_CALL];
}

// Serial.readStringUntil(terminator)
arduinoGen.forBlock['serial_read_string'] = function (block) {
    const terminator = block.getFieldValue('TERMINATOR');
    return ['Serial.readStringUntil(' + terminator + ')', Order.FUNCTION_CALL];
}
