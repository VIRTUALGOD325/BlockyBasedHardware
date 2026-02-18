import { arduinoGen, Order } from './arduino';

// Setting Pin Mode
arduinoGen.forBlock['set_pin_mode'] = function (block) {
    const pin = arduinoGen.valueToCode(block, "PIN", Order.ATOMIC) || block.getFieldValue("PIN");
    const mode = block.getFieldValue("MODE")
    arduinoGen.setupCode_["pin_mode_" + pin] = 'pinMode(' + pin + ',' + mode + ');'
    return ''
}

// Digital Write
arduinoGen.forBlock['digital_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE')
    return 'digitalWrite(' + pin + ',' + value + ');\n'
}

// Digital Read
arduinoGen.forBlock['digital_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    return ['digitalRead(' + pin + ')', Order.ATOMIC]
}

// LED Control (ON/OFF)
arduinoGen.forBlock['led_control'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'digitalWrite(' + pin + ', ' + state + ');\n';
}

// Analog Read
arduinoGen.forBlock['analog_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['analogRead(' + pin + ')', Order.ATOMIC];
};

// Pulse In
arduinoGen.forBlock['pulse_in'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    const timeout = block.getFieldValue('TIMEOUT');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['pulseIn(' + pin + ', ' + value + ', ' + timeout + ')', Order.ATOMIC];
};

// Analog Write (PWM)
arduinoGen.forBlock['analog_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'analogWrite(' + pin + ', ' + value + ');\n';
};

// Play Tone
arduinoGen.forBlock['play_tone'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const note = block.getFieldValue('NOTE');
    const duration = block.getFieldValue('DURATION');
    arduinoGen.setupCode_['pin_mode_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'tone(' + pin + ', ' + note + ', ' + duration + ');\n';
};

// Servo Write
arduinoGen.forBlock['servo_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const angle = block.getFieldValue('ANGLE');
    const servoName = 'servo_' + pin;

    arduinoGen.includes_['include_servo'] = '#include <Servo.h>';
    arduinoGen.definitions_['define_servo_' + pin] = 'Servo ' + servoName + ';';
    arduinoGen.setupCode_['attach_servo_' + pin] = servoName + '.attach(' + pin + ');';

    return servoName + '.write(' + angle + ');\n';
};

// Attach Interrupt
// Suspend Pin (Attach Interrupt)
arduinoGen.forBlock['suspend_pin'] = function (block) {
    const pin = block.getFieldValue('PIN');
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
    const pin = block.getFieldValue('PIN');
    return 'detachInterrupt(digitalPinToInterrupt(' + pin + '));\n';
};
