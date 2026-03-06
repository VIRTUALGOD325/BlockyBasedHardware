import { arduinoGen, Order } from './arduino';


// Helper Function 
arduinoGen.forBlock['read_ultrasonic'] = function (block) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');

    arduinoGen.includes_['ultrasonic_func'] = `
        long readUltrasonic(int trigPin, int echoPin) {
        digitalWrite(trigPin, HIGH);   
        delayMicroseconds(10);
        digitalWrite(trigPin, LOW);
        long duration = pulseIn(echoPin, HIGH);
        long distance = 0.017 * duration;
        return distance;
        }
    `;

    arduinoGen.setupCode_['trig_' + trig] = 'pinMode(' + trig + ', OUTPUT);';
    arduinoGen.setupCode_['echo_' + echo] = 'pinMode(' + echo + ', INPUT);';

    const code = 'readUltrasonic(' + trig + ', ' + echo + ')';
    return [code, Order.ATOMIC];
};


arduinoGen.forBlock['read_dht'] = function (block) {
    const type = block.getFieldValue('TYPE');
    const pin = block.getFieldValue('PIN');
    const read = block.getFieldValue('READING')

    arduinoGen.includes_['dht_lib'] = '#include <DHT.h>'
    arduinoGen.variables_['dht_obj'] = 'DHT dht(' + pin + ',' + type + ');'
    arduinoGen.setupCode_['dht_begin'] = 'dht.begin();'

    if (read == "temperature") {
        return ['dht.readTemperature()', Order.ATOMIC]
    }
    else {
        return ['dht.readHumidity()', Order.ATOMIC]
    }
}

arduinoGen.forBlock['read_ir'] = function (block) {
    const pin = block.getFieldValue('PIN');
    arduinoGen.includes_['ir_lib'] = '#include <IRremote.h>';
    arduinoGen.variables_['ir_recv'] = 'IRrecv irrecv(' + pin + ');';
    arduinoGen.variables_['ir_results'] = 'decode_results results;';
    arduinoGen.setupCode_['ir_begin'] = 'irrecv.enableIRIn();';
    return '';
}

// IR Result Available (boolean check)
arduinoGen.forBlock['ir_result_available'] = function (_block) {
    arduinoGen.includes_['ir_lib'] = '#include <IRremote.h>';
    arduinoGen.variables_['ir_results'] = 'decode_results results;';
    return ['irrecv.decode(&results)', Order.ATOMIC];
};

// IR Get Value (Decimal or Hexadecimal)
arduinoGen.forBlock['ir_get_value'] = function (block) {
    const format = block.getFieldValue('FORMAT');
    arduinoGen.includes_['ir_lib'] = '#include <IRremote.h>';
    arduinoGen.variables_['ir_results'] = 'decode_results results;';
    if (format === 'HEX') {
        return ['String(results.value, HEX)', Order.ATOMIC];
    }
    return ['results.value', Order.ATOMIC];
};

// IR Resume
arduinoGen.forBlock['ir_resume'] = function (_block) {
    arduinoGen.includes_['ir_lib'] = '#include <IRremote.h>';
    return 'irrecv.resume();\n';
};

// IR Key Code
arduinoGen.forBlock['ir_key_code'] = function (block) {
    const key = block.getFieldValue('KEY');
    return [key, Order.ATOMIC];
};

// Timer
arduinoGen.forBlock['timer'] = function (_block) {
    arduinoGen.definitions_['timer_offset'] = 'long timerOffset = 0;';
    return ['(millis() - timerOffset) / 1000.0', Order.ATOMIC];
};

// Reset Timer
arduinoGen.forBlock['reset_timer'] = function (_block) {
    arduinoGen.definitions_['timer_offset'] = 'long timerOffset = 0;';
    return 'timerOffset = millis();\n';
};
