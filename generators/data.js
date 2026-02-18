import { arduinoGen, Order } from './arduino';

// Map Value
arduinoGen.forBlock['map_value'] = function (block) {
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    const fromLow = arduinoGen.valueToCode(block, 'FROM_LOW', Order.ATOMIC) || '0';
    const fromHigh = arduinoGen.valueToCode(block, 'FROM_HIGH', Order.ATOMIC) || '1023';
    const toLow = arduinoGen.valueToCode(block, 'TO_LOW', Order.ATOMIC) || '0';
    const toHigh = arduinoGen.valueToCode(block, 'TO_HIGH', Order.ATOMIC) || '255';

    return ['map(' + value + ', ' + fromLow + ', ' + fromHigh + ', ' + toLow + ', ' + toHigh + ')', Order.ATOMIC];
};

// Constrain Value
arduinoGen.forBlock['constrain_value'] = function (block) {
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    const min = arduinoGen.valueToCode(block, 'MIN', Order.ATOMIC) || '0';
    const max = arduinoGen.valueToCode(block, 'MAX', Order.ATOMIC) || '100';

    return ['constrain(' + value + ', ' + min + ', ' + max + ')', Order.ATOMIC];
};

// Convert to Type
arduinoGen.forBlock['convert_to_type'] = function (block) {
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    const type = block.getFieldValue('TYPE');

    let code;
    if (type === 'INT') {
        code = '(int)(' + value + ')';
    } else if (type === 'FLOAT') {
        code = '(float)(' + value + ')';
    } else if (type === 'STRING') {
        code = 'String(' + value + ')';
    } else {
        code = value;
    }
    return [code, Order.ATOMIC];
};

// ASCII Character
arduinoGen.forBlock['ascii_char'] = function (block) {
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '97';
    return ['char(' + value + ')', Order.ATOMIC];
};

// ASCII Number
arduinoGen.forBlock['ascii_num'] = function (block) {
    // For ascii_num, the input is likely a single character string or char
    // If it's a string block, we might get "\"a\"" or "'a'".
    // We want to cast it to int.
    // If usage is like: ascii_num('a') -> (int)'a'
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || "' '";
    return ['(int)' + value, Order.ATOMIC];
};
