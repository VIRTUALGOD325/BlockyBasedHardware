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
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || "' '";
    return ['(int)' + value, Order.ATOMIC];
};

// ── Typed variable declarations ──────────────────────────────────────────────

arduinoGen.forBlock['declare_int'] = function (block) {
    const name = block.getFieldValue('VAR') || 'myInt';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    arduinoGen.variables_['var_' + name] = 'int ' + name + ';';
    return name + ' = ' + value + ';\n';
};

arduinoGen.forBlock['declare_float'] = function (block) {
    const name = block.getFieldValue('VAR') || 'myFloat';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0.0';
    arduinoGen.variables_['var_' + name] = 'float ' + name + ';';
    return name + ' = ' + value + ';\n';
};

arduinoGen.forBlock['declare_string'] = function (block) {
    const name = block.getFieldValue('VAR') || 'myStr';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '""';
    arduinoGen.variables_['var_' + name] = 'String ' + name + ';';
    return name + ' = ' + value + ';\n';
};

// ── Array declarations ───────────────────────────────────────────────────────

arduinoGen.forBlock['declare_array_1d'] = function (block) {
    const name   = block.getFieldValue('VAR')    || 'myArray';
    const size   = block.getFieldValue('SIZE')   || '5';
    const values = block.getFieldValue('VALUES') || '0';
    arduinoGen.variables_['arr_' + name] = 'int ' + name + '[' + size + '] = {' + values + '};';
    return '';
};

arduinoGen.forBlock['declare_array_2d'] = function (block) {
    const name   = block.getFieldValue('VAR')    || 'myMatrix';
    const rows   = block.getFieldValue('ROWS')   || '2';
    const cols   = block.getFieldValue('COLS')   || '3';
    const values = block.getFieldValue('VALUES') || '{0}';
    arduinoGen.variables_['arr_' + name] = 'int ' + name + '[' + rows + '][' + cols + '] = {' + values + '};';
    return '';
};

arduinoGen.forBlock['array_get'] = function (block) {
    const name  = block.getFieldValue('VAR') || 'myArray';
    const index = arduinoGen.valueToCode(block, 'INDEX', Order.ATOMIC) || '0';
    return [name + '[' + index + ']', Order.ATOMIC];
};

arduinoGen.forBlock['array_set'] = function (block) {
    const name  = block.getFieldValue('VAR') || 'myArray';
    const index = arduinoGen.valueToCode(block, 'INDEX', Order.ATOMIC) || '0';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    return name + '[' + index + '] = ' + value + ';\n';
};

arduinoGen.forBlock['array_get_2d'] = function (block) {
    const name = block.getFieldValue('VAR') || 'myMatrix';
    const row  = arduinoGen.valueToCode(block, 'ROW', Order.ATOMIC) || '0';
    const col  = arduinoGen.valueToCode(block, 'COL', Order.ATOMIC) || '0';
    return [name + '[' + row + '][' + col + ']', Order.ATOMIC];
};
