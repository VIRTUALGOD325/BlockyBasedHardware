import { arduinoGen, Order } from './arduino';

// Setting Pin Mode
arduinoGen.forBlock['set_pin_mode'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '13';
    const mode = block.getFieldValue("MODE")
    arduinoGen.setupCode_["pin_mode_" + pin] = 'pinMode(' + pin + ',' + mode + ');'
    return ''
}

// Digital Write
arduinoGen.forBlock['digital_write'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '13';
    const value = block.getFieldValue('VALUE');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'digitalWrite(' + pin + ',' + value + ');\n'
}

// Digital Read
arduinoGen.forBlock['digital_read'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '2';
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['digitalRead(' + pin + ')', Order.ATOMIC]
}

// LED Control (ON/OFF)
arduinoGen.forBlock['led_control'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '13';
    const state = block.getFieldValue('STATE');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'digitalWrite(' + pin + ', ' + state + ');\n';
}

// Analog Read (pin is a text field, e.g. A0)
arduinoGen.forBlock['analog_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['analogRead(' + pin + ')', Order.ATOMIC];
};

// Pulse In
arduinoGen.forBlock['pulse_in'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '13';
    const value = block.getFieldValue('VALUE');
    const timeout = block.getFieldValue('TIMEOUT');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['pulseIn(' + pin + ', ' + value + ', ' + timeout + ')', Order.ATOMIC];
};

// Analog Write (PWM)
arduinoGen.forBlock['analog_write'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '5';
    const value = arduinoGen.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'analogWrite(' + pin + ', ' + value + ');\n';
};

// Play Tone
arduinoGen.forBlock['play_tone'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '9';
    const note = block.getFieldValue('NOTE');
    const duration = arduinoGen.valueToCode(block, 'DURATION', Order.ATOMIC) || '1000';
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'tone(' + pin + ', ' + note + ', ' + duration + ');\n';
};

// Servo Write
arduinoGen.forBlock['servo_write'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '9';
    const angle = arduinoGen.valueToCode(block, 'ANGLE', Order.ATOMIC) || '90';
    const servoName = 'servo_' + pin;

    arduinoGen.includes_['include_servo'] = '#include <Servo.h>';
    arduinoGen.definitions_['define_servo_' + pin] = 'Servo ' + servoName + ';';
    arduinoGen.setupCode_['attach_servo_' + pin] = servoName + '.attach(' + pin + ');';

    return servoName + '.write(' + angle + ');\n';
};

// Attach Interrupt (Suspend Pin)
arduinoGen.forBlock['suspend_pin'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '2';
    const mode = block.getFieldValue('MODE');
    const branch = arduinoGen.statementToCode(block, 'DO');
    const funcName = 'interrupt_isr_' + pin;

    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    arduinoGen.setupCode_['attach_interrupt_' + pin] = 'attachInterrupt(digitalPinToInterrupt(' + pin + '), ' + funcName + ', ' + mode + ');';

    arduinoGen.definitions_['define_isr_' + pin] = 'void ' + funcName + '() {\n' + branch + '}';

    return '';
};

// Do Not Suspend Pin (Detach Interrupt)
arduinoGen.forBlock['do_not_suspend_pin'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '2';
    return 'detachInterrupt(digitalPinToInterrupt(' + pin + '));\n';
};
