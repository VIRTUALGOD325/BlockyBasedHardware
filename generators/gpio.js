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
