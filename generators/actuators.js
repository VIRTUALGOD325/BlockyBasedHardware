import { arduinoGen, Order } from './arduino';

arduinoGen.forBlock['set_servo_angle'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '9';
    const angle = arduinoGen.valueToCode(block, 'ANGLE', Order.ATOMIC) || '90';
    arduinoGen.includes_['servo_lib'] = '#include <Servo.h>'
    arduinoGen.variables_['servo_' + pin] = 'Servo servo_' + pin + ';'
    arduinoGen.setupCode_['servo_attach_' + pin] = 'servo_' + pin + '.attach(' + pin + ');'
    return 'servo_' + pin + '.write(' + angle + ');\n'
}

arduinoGen.forBlock['servo_read'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '9';
    arduinoGen.includes_['servo_lib'] = '#include <Servo.h>'
    arduinoGen.variables_['servo_' + pin] = 'Servo servo_' + pin + ';'
    arduinoGen.setupCode_['servo_attach_' + pin] = 'servo_' + pin + '.attach(' + pin + ');'
    return ['servo_' + pin + '.read()', Order.ATOMIC];
}

arduinoGen.forBlock['servo_detach'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '9';
    arduinoGen.includes_['servo_lib'] = '#include <Servo.h>'
    arduinoGen.variables_['servo_' + pin] = 'Servo servo_' + pin + ';'
    arduinoGen.setupCode_['servo_attach_' + pin] = 'servo_' + pin + '.attach(' + pin + ');'
    return 'servo_' + pin + '.detach();\n'
}

arduinoGen.forBlock['set_motor_speed'] = function (block) {
    const en = arduinoGen.valueToCode(block, 'EN', Order.ATOMIC) || '5';
    const in1 = arduinoGen.valueToCode(block, 'IN1', Order.ATOMIC) || '6';
    const in2 = arduinoGen.valueToCode(block, 'IN2', Order.ATOMIC) || '7';
    const spd = arduinoGen.valueToCode(block, 'SPEED', Order.ATOMIC) || '0';
    arduinoGen.setupCode_['motor_pins_' + en] = 'pinMode(' + en + ', OUTPUT);\npinMode(' + in1 + ', OUTPUT);\npinMode(' + in2 + ', OUTPUT);'
    return 'digitalWrite(' + in1 + ', HIGH);\n' + 'digitalWrite(' + in2 + ', LOW);\n' + 'analogWrite(' + en + ', ' + spd + ');\n';
}

arduinoGen.forBlock['set_neopixel'] = function (block) {
    const pin = arduinoGen.valueToCode(block, 'PIN', Order.ATOMIC) || '6';
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
