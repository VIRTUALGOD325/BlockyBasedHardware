import * as blockly from "blockly";

blockly.common.defineBlocksWithJsonArray([
    {
        "type": "read_ultrasonic",
        "message0": "read ultrasonic sensor trig pin %1 echo pin %2",
        "args0": [{
            "type": "field_number",
            "name": "TRIG",
            "value": 1,
            "min": 0
        },
        {
            "type": "field_number",
            "name": "ECHO",
            "value": 1,
            "min": 0
        }],
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "Reads distance from ultrasonic sensor"
    },
    {
        "type": "read_dht",
        "message0": "DHT %1 on pin %2 read %3",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "TYPE",
                "options": [
                    ["DHT11", "DHT11"],
                    ["DHT22", "DHT22"]
                ]
            },
            {
                "type": "field_number",
                "name": "PIN",
                "value": 4,
                "min": 0
            },
            {
                "type": "field_dropdown",
                "name": "READING",
                "options": [
                    ["temperature", "temperature"],
                    ["humidity", "humidity"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "Reads temperature or humidity from DHT sensor"
    },
    {
        "type": "read_ir",
        "message0": "IR remote pin %1",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 4,
                "min": 0
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4CBFE6",
        "tooltip": "Set up IR receiver on a pin"
    },
    {
        "type": "ir_result_available",
        "message0": "IR result available?",
        "output": "Boolean",
        "colour": "#4CBFE6",
        "tooltip": "Returns true if an IR signal has been received and decoded"
    },
    {
        "type": "ir_get_value",
        "message0": "IR result value %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "FORMAT",
                "options": [
                    ["Decimal", "DEC"],
                    ["Hexadecimal", "HEX"]
                ]
            }
        ],
        "output": null,
        "colour": "#4CBFE6",
        "tooltip": "Returns the decoded IR value in Decimal or Hexadecimal format"
    },
    {
        "type": "ir_resume",
        "message0": "resume IR receiver",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4CBFE6",
        "tooltip": "Resumes the IR receiver to listen for the next signal"
    },
    {
        "type": "ir_key_code",
        "message0": "IR key %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "KEY",
                "options": [
                    ["A", "16753245"],
                    ["B", "16736925"],
                    ["C", "16769565"],
                    ["D", "16720605"],
                    ["E", "16761405"],
                    ["F", "16756815"],
                    ["Up (^)", "16712445"],
                    ["Down (v)", "16750695"],
                    ["Left (<)", "16769055"],
                    ["Right (>)", "16748655"],
                    ["Settings", "16754775"],
                    ["0", "16738455"],
                    ["1", "16724175"],
                    ["2", "16718055"],
                    ["3", "16743045"],
                    ["4", "16716015"],
                    ["5", "16726215"],
                    ["6", "16734885"],
                    ["7", "16728765"],
                    ["8", "16728765"],
                    ["9", "16732845"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "Returns the key code for a button on the IR remote"
    },
    {
        "type": "timer",
        "message0": "timer",
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "Returns the number of seconds since the program started (or since last reset)"
    },
    {
        "type": "reset_timer",
        "message0": "reset timer",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4CBFE6",
        "tooltip": "Resets the timer to 0"
    }
])



