import { arduinoGen, Order } from "./arduino";

arduinoGen.forBlock['analog_write'] = function (block) {
    const pin = block.getFieldValue('PIN')
    const value = block.getFieldValue('VALUE')
    return 'analogWrite(' + pin + ',' + value + ');\n'
}

arduinoGen.forBlock['analog_read'] = function (block) {
    const pin = block.getFieldValue('PIN')
    return ['analogRead(' + pin + ');', Order.ATOMIC]
}

