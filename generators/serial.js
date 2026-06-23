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
    arduinoGen.setupCode_['serial_begin'] = arduinoGen.setupCode_['serial_begin'] || 'Serial.begin(9600);';
    return ['Serial.available()', Order.FUNCTION_CALL];
}

// Serial.read()
arduinoGen.forBlock['serial_read'] = function () {
    arduinoGen.setupCode_['serial_begin'] = arduinoGen.setupCode_['serial_begin'] || 'Serial.begin(9600);';
    return ['Serial.read()', Order.FUNCTION_CALL];
}

// ASCII code of a character literal — emits a C char literal which the compiler
// folds to its numeric ASCII value. Sanitises the field so kids can't break the
// generated code by entering quotes or backslashes.
arduinoGen.forBlock['serial_ascii_code'] = function (block) {
    let ch = block.getFieldValue('CHAR') || '';
    // Take only the first character — keeps the block honestly single-char.
    ch = ch.charAt(0);
    if (!ch) return ['0', Order.ATOMIC];
    // Escape special chars so the emitted C is valid.
    const escapes = { "'": "\\'", '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
    const escaped = escapes[ch] || ch;
    return [`'${escaped}'`, Order.ATOMIC];
}

// Digit value of an ASCII byte: '0'..'9' (48..57) -> 0..9.
arduinoGen.forBlock['serial_digit_value'] = function (block) {
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.SUBTRACTION) || '0';
    return [`((${value}) - '0')`, Order.SUBTRACTION];
}

// Serial.readStringUntil(terminator)
arduinoGen.forBlock['serial_read_string'] = function (block) {
    arduinoGen.setupCode_['serial_begin'] = arduinoGen.setupCode_['serial_begin'] || 'Serial.begin(9600);';
    const terminator = block.getFieldValue('TERMINATOR');
    return ['Serial.readStringUntil(' + terminator + ')', Order.FUNCTION_CALL];
}
