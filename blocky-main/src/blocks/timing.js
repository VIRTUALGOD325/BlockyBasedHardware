import * as blockly from "blockly";

blockly.common.defineBlocksWithJsonArray([
    {
        "type":"delay_ms",
        "message0": "wait %1 millisecond",
        "args0":[{
            "type":"field_number",
            "default": 1000,
            "min":0,
            "max": 60000
        }],
        "previousStatement":null,
        "nextStatement":null,
        "colour":"#3498DB",
        "tooltip":"Delay the program for a specified number of milliseconds"
    },
    {
        "type":"delay_s",
        "message0": "wait %1 microsecond",
        "args0":[{
            "type":"field_number",
            "default": 100,
            "min":0,
            "max": 60
        }],
        "previousStatement":null,
        "nextStatement":null,
        "colour":"#3498DB",
        "tooltip":"Delay the program for a specified number of microseconds"
    }  
])







