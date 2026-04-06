import { arduinoGen, Order } from './arduino';

// ─── Procedures (My Blocks) ─────────────────────────────────────
// These generators handle the blocks produced by Blockly's built-in
// PROCEDURE category (custom: "PROCEDURE" in the toolbox).

/**
 * procedures_defnoreturn — Define a void function
 * Generates:  void myFunc(int arg1, int arg2) { ... }
 */
arduinoGen.forBlock['procedures_defnoreturn'] = function (block) {
    const funcName = arduinoGen.getVariableName(block.getFieldValue('NAME'));
    const args = [];
    const variables = block.getVars ? block.getVars() : [];

    for (let i = 0; i < variables.length; i++) {
        args.push('int ' + arduinoGen.getVariableName(variables[i]));
    }

    const branch = arduinoGen.statementToCode(block, 'STACK');
    const signature = 'void ' + funcName + '(' + args.join(', ') + ')';

    arduinoGen.definitions_['func_' + funcName] =
        signature + ' {\n' + branch + '}';

    return null; // Definitions don't produce inline code
};

/**
 * procedures_defreturn — Define a function that returns a value
 * Generates:  int myFunc(int arg1) { ... return val; }
 */
arduinoGen.forBlock['procedures_defreturn'] = function (block) {
    const funcName = arduinoGen.getVariableName(block.getFieldValue('NAME'));
    const args = [];
    const variables = block.getVars ? block.getVars() : [];

    for (let i = 0; i < variables.length; i++) {
        args.push('int ' + arduinoGen.getVariableName(variables[i]));
    }

    const branch = arduinoGen.statementToCode(block, 'STACK');
    const returnValue = arduinoGen.valueToCode(block, 'RETURN', Order.NONE) || '0';

    // Infer return type from the return value
    let returnType = 'int';
    if (returnValue.startsWith('"') || returnValue.startsWith('String(')) {
        returnType = 'String';
    } else if (returnValue.includes('.') && !returnValue.includes('(')) {
        returnType = 'float';
    }

    const signature = returnType + ' ' + funcName + '(' + args.join(', ') + ')';

    arduinoGen.definitions_['func_' + funcName] =
        signature + ' {\n' + branch + '  return ' + returnValue + ';\n}';

    return null; // Definitions don't produce inline code
};

/**
 * procedures_callnoreturn — Call a void function
 * Generates:  myFunc(val1, val2);
 */
arduinoGen.forBlock['procedures_callnoreturn'] = function (block) {
    const funcName = arduinoGen.getVariableName(block.getFieldValue('NAME'));
    const args = [];

    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
        args.push(
            arduinoGen.valueToCode(block, 'ARG' + i, Order.NONE) || '0'
        );
    }

    return funcName + '(' + args.join(', ') + ');\n';
};

/**
 * procedures_callreturn — Call a function that returns a value
 * Generates:  myFunc(val1, val2)  (as an expression)
 */
arduinoGen.forBlock['procedures_callreturn'] = function (block) {
    const funcName = arduinoGen.getVariableName(block.getFieldValue('NAME'));
    const args = [];

    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
        args.push(
            arduinoGen.valueToCode(block, 'ARG' + i, Order.NONE) || '0'
        );
    }

    return [funcName + '(' + args.join(', ') + ')', Order.FUNCTION_CALL];
};

/**
 * procedures_ifreturn — Conditional early return inside a procedure
 * Generates:  if (cond) { return val; }
 */
arduinoGen.forBlock['procedures_ifreturn'] = function (block) {
    const condition = arduinoGen.valueToCode(block, 'CONDITION', Order.NONE) || 'false';

    let code = 'if (' + condition + ') {\n';

    // Check if this block has a return value field
    if (block.hasReturnValue_) {
        const value = arduinoGen.valueToCode(block, 'VALUE', Order.NONE) || '0';
        code += '  return ' + value + ';\n';
    } else {
        code += '  return;\n';
    }

    code += '}\n';
    return code;
};
