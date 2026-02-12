import * as blockly from "blockly";

blockly.common.defineBlocksWithJsonArray([
    {
        "type": "read_ultrasonic",
        "message0": "ultrasonic distance trig %1 echo %2",
        "args0": [{
            "type": "field_number",
            "name": "TRIG",
            "default": 9
        },
        {
            "type": "field_number",
            "name": "ECHO",
            "default": 10
        }],
        "output": "Number",
        "colour": "#27AE60",
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
                "default": 4
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
        "colour": "#27AE60",
        "tooltip": "Reads temperature or humidity from DHT sensor"
    },
    {
        "type": "read_ir",
        "message0": "IR receiver on pin %1",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "default": 11
            }
        ],
        "output": "Number",
        "colour": "#27AE60",
        "tooltip": "Reads value from IR receiver"
    }
])



