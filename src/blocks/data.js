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
        "colour": "#9966FF",
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
        "colour": "#9966FF",
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
        "colour": "#9966FF",
        "tooltip": "Convert a value to a specific type"
    },
    {
        "type": "ascii_char",
        "message0": "%1 converted ASCII character",
        "args0": [
            { "type": "input_value", "name": "VALUE" }
        ],
        "output": "String",
        "colour": "#9966FF",
        "tooltip": "Convert an ASCII code to a character"
    },
    {
        "type": "ascii_num",
        "message0": "%1 converted ASCII number",
        "args0": [
            { "type": "input_value", "name": "VALUE" }
        ],
        "output": "Number",
        "colour": "#9966FF",
        "tooltip": "Convert a character to its ASCII code"
    },

    // ── Typed variable declarations ─────────────────────────────────
    {
        "type": "declare_int",
        "message0": "int %1 = %2",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myInt" },
            { "type": "input_value", "name": "VALUE", "check": "Number" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF",
        "tooltip": "Declare an integer variable"
    },
    {
        "type": "declare_float",
        "message0": "float %1 = %2",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myFloat" },
            { "type": "input_value", "name": "VALUE", "check": "Number" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF",
        "tooltip": "Declare a float variable"
    },
    {
        "type": "declare_string",
        "message0": "String %1 = %2",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myStr" },
            { "type": "input_value", "name": "VALUE" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF",
        "tooltip": "Declare a String variable"
    },

    // ── Array declarations ──────────────────────────────────────────
    {
        "type": "declare_array_1d",
        "message0": "int %1 [ %2 ] = { %3 }",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myArray" },
            { "type": "field_number", "name": "SIZE", "value": 5, "min": 1 },
            { "type": "field_input", "name": "VALUES", "text": "0, 0, 0, 0, 0" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF",
        "tooltip": "Declare a 1D integer array"
    },
    {
        "type": "declare_array_2d",
        "message0": "int %1 [ %2 ][ %3 ] = { %4 }",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myMatrix" },
            { "type": "field_number", "name": "ROWS", "value": 2, "min": 1 },
            { "type": "field_number", "name": "COLS", "value": 3, "min": 1 },
            { "type": "field_input", "name": "VALUES", "text": "{1,2,3},{4,5,6}" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF",
        "tooltip": "Declare a 2D integer array"
    },
    {
        "type": "array_get",
        "message0": "%1 [ %2 ]",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myArray" },
            { "type": "input_value", "name": "INDEX", "check": "Number" }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#9966FF",
        "tooltip": "Get element at index from array"
    },
    {
        "type": "array_set",
        "message0": "%1 [ %2 ] = %3",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myArray" },
            { "type": "input_value", "name": "INDEX", "check": "Number" },
            { "type": "input_value", "name": "VALUE" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF",
        "tooltip": "Set element at index in array"
    },
    {
        "type": "array_get_2d",
        "message0": "%1 [ %2 ][ %3 ]",
        "args0": [
            { "type": "field_input", "name": "VAR", "text": "myMatrix" },
            { "type": "input_value", "name": "ROW", "check": "Number" },
            { "type": "input_value", "name": "COL", "check": "Number" }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#9966FF",
        "tooltip": "Get element from 2D array"
    }
]);
