import * as Blockly from "blockly";

Blockly.common.defineBlocksWithJsonArray([
    // Serial.begin(baudRate)
    {
        "type": "serial_begin",
        "message0": "Serial begin at %1 baud",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "BAUD",
                "options": [
                    ["9600", "9600"],
                    ["19200", "19200"],
                    ["38400", "38400"],
                    ["57600", "57600"],
                    ["115200", "115200"]
                ]
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#00979D",
        "tooltip": "Start serial communication at the given baud rate"
    },

    // Serial.print(value)
    {
        "type": "serial_print",
        "message0": "write %1 to serial port",
        "args0": [
            {
                "type": "input_value",
                "name": "VALUE"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#00979D",
        "tooltip": "Print a value to the serial monitor (no newline)"
    },

    // Serial.println(value)
    {
        "type": "serial_println",
        "message0": "Serial print line %1",
        "args0": [
            {
                "type": "input_value",
                "name": "VALUE"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#00979D",
        "tooltip": "Print a value to the serial monitor followed by a newline"
    },

    // Serial.available()
    {
        "type": "serial_available",
        "message0": "readable bytes from serial port",
        "output": "Number",
        "colour": "#00979D",
        "tooltip": "Returns the number of bytes available to read from the serial port"
    },

    // Serial.read()
    {
        "type": "serial_read",
        "message0": "read a byte from serial port",
        "output": "Number",
        "colour": "#00979D",
        "tooltip": "Reads a single byte from the serial port (returns -1 if none available)"
    },

    // ASCII code of a character — returns the numeric ASCII value (e.g. '1' -> 49).
    // Lets kids compare a byte read from the serial port against a readable
    // character literal instead of memorising ASCII tables.
    {
        "type": "serial_ascii_code",
        "message0": "ASCII code of %1",
        "args0": [
            {
                "type": "field_input",
                "name": "CHAR",
                "text": "1"
            }
        ],
        "output": "Number",
        "colour": "#00979D",
        "tooltip": "Returns the ASCII code of a single character (e.g. '1' = 49, 'A' = 65). Use this with the read-byte block to check what character was received over serial/Bluetooth."
    },

    // Digit value of an ASCII byte — converts '0'..'9' to 0..9.
    // Common when receiving a single digit over HC-05 Bluetooth or USB serial.
    {
        "type": "serial_digit_value",
        "message0": "digit value of %1",
        "args0": [
            {
                "type": "input_value",
                "name": "VALUE",
                "check": "Number"
            }
        ],
        "output": "Number",
        "colour": "#00979D",
        "tooltip": "Converts an ASCII digit byte to its numeric value (e.g. 49 → 1). Useful when reading a single digit '0'-'9' from the serial port."
    },

    // Serial.readStringUntil(terminator)
    {
        "type": "serial_read_string",
        "message0": "Serial read string until %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "TERMINATOR",
                "options": [
                    ["newline (\\n)", "'\\n'"],
                    ["carriage return (\\r)", "'\\r'"],
                    ["comma (,)", "','"],
                    ["space ( )", "' '"]
                ]
            }
        ],
        "output": "String",
        "colour": "#00979D",
        "tooltip": "Reads a string from the serial port until the specified character"
    }
]);
