import * as blockly from "blockly";

blockly.common.defineBlocksWithJsonArray([
    {
        "type": "delay_ms",
        "message0": "wait %1 millisecond",
        "args0": [{
            "type": "field_number",
            "name": "TIME",
            "value": 1000,
            "min": 0,
            "max": 60000
        }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF",
        "tooltip": "Delay the program for a specified number of milliseconds"
    },
    {
        "type": "delay_us",
        "message0": "wait %1 microsecond",
        "args0": [{
            "type": "field_number",
            "name": "TIME",
            "value": 100,
            "min": 0,
            "max": 1000000
        }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF",
        "tooltip": "Delay the program for a specified number of microseconds"
    },
    {
        "type": "forever_loop",
        "message0": "forever %1",
        "args0": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Repeat the enclosed blocks forever"
    }
])







