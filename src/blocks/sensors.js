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
        "message0": "IR receiver on pin %1",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 11,
                "min": 0
            }
        ],
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "Reads value from IR receiver"
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



