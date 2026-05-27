import { arduinoGen, Order } from './arduino';

arduinoGen.forBlock['set_servo_angle'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const angle = arduinoGen.valueToCode(block, 'ANGLE', Order.ATOMIC) || '90';
    arduinoGen.includes_['servo_lib'] = '#include <Servo.h>'
    arduinoGen.variables_['servo_' + pin] = 'Servo servo_' + pin + ';'
    arduinoGen.setupCode_['servo_attach_' + pin] = 'servo_' + pin + '.attach(' + pin + ');'
    return 'servo_' + pin + '.write(' + angle + ');\n'
}

arduinoGen.forBlock['servo_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    arduinoGen.includes_['servo_lib'] = '#include <Servo.h>'
    arduinoGen.variables_['servo_' + pin] = 'Servo servo_' + pin + ';'
    arduinoGen.setupCode_['servo_attach_' + pin] = 'servo_' + pin + '.attach(' + pin + ');'
    return ['servo_' + pin + '.read()', Order.ATOMIC];
}

arduinoGen.forBlock['servo_detach'] = function (block) {
    const pin = block.getFieldValue('PIN');
    arduinoGen.includes_['servo_lib'] = '#include <Servo.h>'
    arduinoGen.variables_['servo_' + pin] = 'Servo servo_' + pin + ';'
    // We still attach in setup, assuming the user might want to use it before detaching
    arduinoGen.setupCode_['servo_attach_' + pin] = 'servo_' + pin + '.attach(' + pin + ');'
    return 'servo_' + pin + '.detach();\n'
}

arduinoGen.forBlock['set_motor_speed'] = function (block) {
    const en = block.getFieldValue('EN');
    const in1 = block.getFieldValue('IN1');
    const in2 = block.getFieldValue('IN2');
    const spd = arduinoGen.valueToCode(block, 'SPEED', Order.ATOMIC) || '0';
    arduinoGen.setupCode_['motor_pins_' + en] = 'pinMode(' + en + ', OUTPUT);\npinMode(' + in1 + ', OUTPUT);\npinMode(' + in2 + ', OUTPUT);'
    return 'digitalWrite(' + in1 + ', HIGH);\n' + 'digitalWrite(' + in2 + ', LOW);\n' + 'analogWrite(' + en + ', ' + spd + ');\n';
}

arduinoGen.forBlock['set_neopixel'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const index = arduinoGen.valueToCode(block, 'LED', Order.ATOMIC) || '0';
    const r = arduinoGen.valueToCode(block, 'R', Order.ATOMIC) || '0';
    const g = arduinoGen.valueToCode(block, 'G', Order.ATOMIC) || '0';
    const b = arduinoGen.valueToCode(block, 'B', Order.ATOMIC) || '0';

    arduinoGen.includes_['neo_lib'] = '#include <Adafruit_NeoPixel.h>'
    arduinoGen.variables_['strip'] = 'Adafruit_NeoPixel strip(30, ' + pin + ', NEO_GRB + NEO_KHZ800);'
    arduinoGen.setupCode_['strip_begin'] = 'strip.begin();\nstrip.show();'
    return 'strip.setPixelColor(' + index + ', strip.Color(' + r + ',' + g + ',' + b + '));\n' +
        'strip.show();\n'
}
