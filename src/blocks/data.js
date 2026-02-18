import * as Blockly from "blockly";

Blockly.common.defineBlocksWithJsonArray([
    {
        "type": "map_value",
        "message0": "map %1 from ( %2 , %3 ) to ( %4 , %5 )",
        "args0": [
            { "type": "input_value", "name": "VALUE" },
            { "type": "input_value", "name": "FROM_LOW" },
            { "type": "input_value", "name": "FROM_HIGH" },
            { "type": "input_value", "name": "TO_LOW" },
            { "type": "input_value", "name": "TO_HIGH" }
        ],
        "output": "Number",
        "colour": "#8B5CF6",
        "tooltip": "Map a value from one range to another"
    },
    {
        "type": "constrain_value",
        "message0": "constrain %1 between ( %2 , %3 )",
        "args0": [
            { "type": "input_value", "name": "VALUE" },
            { "type": "input_value", "name": "MIN" },
            { "type": "input_value", "name": "MAX" }
        ],
        "output": "Number",
        "colour": "#8B5CF6",
        "tooltip": "Constrain a value between min and max"
    },
    {
        "type": "convert_to_type",
        "message0": "%1 converted to %2",
        "args0": [
            { "type": "input_value", "name": "VALUE" },
            {
                "type": "field_dropdown",
                "name": "TYPE",
                "options": [
                    ["whole number", "INT"],
                    ["decimal number", "FLOAT"],
                    ["string", "STRING"]
                ]
            }
        ],
        "output": null,
        "colour": "#8B5CF6",
        "tooltip": "Convert a value to a specific type"
    },
    {
        "type": "ascii_char",
        "message0": "%1 converted ASCII character",
        "args0": [
            { "type": "input_value", "name": "VALUE" }
        ],
        "output": "String",
        "colour": "#8B5CF6",
        "tooltip": "Convert an ASCII code to a character"
    },
    {
        "type": "ascii_num",
        "message0": "%1 converted ASCII number",
        "args0": [
            { "type": "input_value", "name": "VALUE" }
        ],
        "output": "Number",
        "colour": "#8B5CF6",
        "tooltip": "Convert a character to its ASCII code"
    }
]);
