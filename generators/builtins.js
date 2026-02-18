import { arduinoGen, Order } from './arduino';

// ─── Math ───────────────────────────────────────────────────────

// math_number — a number literal
arduinoGen.forBlock['math_number'] = function (block) {
    const num = block.getFieldValue('NUM');
    return [String(num), Order.ATOMIC];
};

// math_arithmetic — +, -, *, /, ^
arduinoGen.forBlock['math_arithmetic'] = function (block) {
    const ops = {
        'ADD': [' + ', Order.ADDITION],
        'MINUS': [' - ', Order.SUBTRACTION],
        'MULTIPLY': [' * ', Order.MULTIPLICATION],
        'DIVIDE': [' / ', Order.DIVISION],
        'POWER': null, // handled separately
    };
    const op = block.getFieldValue('OP');
    if (op === 'POWER') {
        const a = arduinoGen.valueToCode(block, 'A', Order.FUNCTION_CALL) || '0';
        const b = arduinoGen.valueToCode(block, 'B', Order.FUNCTION_CALL) || '0';
        return ['pow(' + a + ', ' + b + ')', Order.FUNCTION_CALL];
    }
    const tuple = ops[op];
    const opStr = tuple[0];
    const order = tuple[1];
    const a = arduinoGen.valueToCode(block, 'A', order) || '0';
    const b = arduinoGen.valueToCode(block, 'B', order) || '0';
    return [a + opStr + b, order];
};

// math_modulo — remainder
arduinoGen.forBlock['math_modulo'] = function (block) {
    const a = arduinoGen.valueToCode(block, 'DIVIDEND', Order.MODULUS) || '0';
    const b = arduinoGen.valueToCode(block, 'DIVISOR', Order.MODULUS) || '1';
    return [a + ' % ' + b, Order.MODULUS];
};

// math_constrain — constrain(value, low, high)
arduinoGen.forBlock['math_constrain'] = function (block) {
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.FUNCTION_CALL) || '0';
    const low = arduinoGen.valueToCode(block, 'LOW', Order.FUNCTION_CALL) || '0';
    const high = arduinoGen.valueToCode(block, 'HIGH', Order.FUNCTION_CALL) || '1023';
    return ['constrain(' + value + ', ' + low + ', ' + high + ')', Order.FUNCTION_CALL];
};

// math_random_int — random(low, high)
arduinoGen.forBlock['math_random_int'] = function (block) {
    const from = arduinoGen.valueToCode(block, 'FROM', Order.FUNCTION_CALL) || '0';
    const to = arduinoGen.valueToCode(block, 'TO', Order.FUNCTION_CALL) || '100';
    return ['random(' + from + ', ' + to + ' + 1)', Order.FUNCTION_CALL];
};


// ─── Text / String ──────────────────────────────────────────────

// text — a string literal
arduinoGen.forBlock['text'] = function (block) {
    const text = block.getFieldValue('TEXT') || '';
    // Escape special characters for C++ string
    const escaped = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
    return ['"' + escaped + '"', Order.ATOMIC];
};

// text_join — concatenate strings using String()
arduinoGen.forBlock['text_join'] = function (block) {
    const count = block.itemCount_;
    if (count === 0) return ['""', Order.ATOMIC];
    if (count === 1) {
        const val = arduinoGen.valueToCode(block, 'ADD0', Order.ATOMIC) || '""';
        return ['String(' + val + ')', Order.FUNCTION_CALL];
    }
    let code = 'String(' + (arduinoGen.valueToCode(block, 'ADD0', Order.ATOMIC) || '""') + ')';
    for (let i = 1; i < count; i++) {
        const val = arduinoGen.valueToCode(block, 'ADD' + i, Order.ATOMIC) || '""';
        code += ' + String(' + val + ')';
    }
    return [code, Order.ADDITION];
};


// ─── Logic ──────────────────────────────────────────────────────

// logic_boolean — true / false
arduinoGen.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', Order.ATOMIC];
};

// logic_compare — ==, !=, <, <=, >, >=
arduinoGen.forBlock['logic_compare'] = function (block) {
    const ops = {
        'EQ': ' == ',
        'NEQ': ' != ',
        'LT': ' < ',
        'LTE': ' <= ',
        'GT': ' > ',
        'GTE': ' >= ',
    };
    const op = ops[block.getFieldValue('OP')];
    const a = arduinoGen.valueToCode(block, 'A', Order.RELATIONAL) || '0';
    const b = arduinoGen.valueToCode(block, 'B', Order.RELATIONAL) || '0';
    return [a + op + b, Order.RELATIONAL];
};

// logic_operation — && , ||
arduinoGen.forBlock['logic_operation'] = function (block) {
    const isAnd = block.getFieldValue('OP') === 'AND';
    const order = isAnd ? Order.LOGICAL_AND : Order.LOGICAL_OR;
    const opStr = isAnd ? ' && ' : ' || ';
    const a = arduinoGen.valueToCode(block, 'A', order) || 'false';
    const b = arduinoGen.valueToCode(block, 'B', order) || 'false';
    return [a + opStr + b, order];
};

// logic_negate — !
arduinoGen.forBlock['logic_negate'] = function (block) {
    const val = arduinoGen.valueToCode(block, 'BOOL', Order.LOGICAL_NOT) || 'true';
    return ['!' + val, Order.LOGICAL_NOT];
};


// ─── Control Flow ───────────────────────────────────────────────

// controls_if — if / else if / else
arduinoGen.forBlock['controls_if'] = function (block) {
    let code = '';
    let n = 0;
    while (block.getInput('IF' + n)) {
        const cond = arduinoGen.valueToCode(block, 'IF' + n, Order.NONE) || 'false';
        const branch = arduinoGen.statementToCode(block, 'DO' + n);
        code += (n === 0 ? 'if' : ' else if') + ' (' + cond + ') {\n' + branch + '}';
        n++;
    }
    if (block.getInput('ELSE')) {
        const elseBranch = arduinoGen.statementToCode(block, 'ELSE');
        code += ' else {\n' + elseBranch + '}';
    }
    return code + '\n';
};

// controls_repeat_ext — repeat N times
arduinoGen.forBlock['controls_repeat_ext'] = function (block) {
    const times = arduinoGen.valueToCode(block, 'TIMES', Order.ASSIGNMENT) || '0';
    const branch = arduinoGen.statementToCode(block, 'DO');
    return 'for (int i = 0; i < ' + times + '; i++) {\n' + branch + '}\n';
};

// controls_whileUntil — while / until loop
arduinoGen.forBlock['controls_whileUntil'] = function (block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    let cond = arduinoGen.valueToCode(block, 'BOOL', Order.NONE) || 'false';
    if (until) cond = '!(' + cond + ')';
    const branch = arduinoGen.statementToCode(block, 'DO');
    return 'while (' + cond + ') {\n' + branch + '}\n';
};


// ─── Variables ──────────────────────────────────────────────────

// variables_get — read a variable
arduinoGen.forBlock['variables_get'] = function (block) {
    const varName = arduinoGen.getVariableName(block.getFieldValue('VAR'));
    return [varName, Order.ATOMIC];
};

// variables_set — set a variable
arduinoGen.forBlock['variables_set'] = function (block) {
    const varName = arduinoGen.getVariableName(block.getFieldValue('VAR'));
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    arduinoGen.variables_['var_' + varName] = 'int ' + varName + ';';
    return varName + ' = ' + value + ';\n';
};
