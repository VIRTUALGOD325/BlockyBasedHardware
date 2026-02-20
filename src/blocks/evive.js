// Evive RGB Extension
/**
 * BLOCK TEMPLATE
 *  {
        "type":,
        "message0":,
        "args0":,
        "previousStatement":,
        "nextStatement":,
        "colour":""
    }
 */


import * as blockly from "blockly";


blockly.common.createBlockDefinitionsFromJsonArray([
    //  1. Evive Program  
    {
        "type": "evive_program",
        "message0": "Evive Program",
        "args0": [],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19"
    },
    // 2. Init Strip {1} with {30} LED pixels on pin {Dropdown: 1-15}
    {
        "type": "evive_init_strip",
        "message0": "Init Strip %1 with %2 LED pixels on pin %3",
        "args0": [
            {
                "type": "field_number",
                "name": "STRIP_NUM",
                "value": 1,
                "min": 1
            },
            {
                "type":"field_number",
                "name": "NUM_LEDS",
                "value": 30,
                "min": 1
            },
            {
                "type":"field_dropdown",
                "name":"PIN",
                "options":[
                    ["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],
                    ["6","6"],["7","7"],["8","8"],["9","9"],["10","10"],
                    ["11","11"],["12","12"],["13","13"],["14","14"],["15","15"]
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour":"#FFAB19"
            }
        ]
    },
    {
        "type":"evive_set_pixel_colour",
        "message0":"Set strip %1 LED Pixel %2 Colour to R%3 G%4 B%5",
        "args0":[
            {
                "type":"field_number",
                "name":"STRIP_NUM",
                "value":1,
                "min":1
            },
            {
                "type":"field_number",
                "name":"LED_NUM",
                "value":1,
                "min":1
            },
            {
                "type":"field_number",
                "name":"R",
                "value":255,
                "min":0,
                "max":255
            },
            {
                "type":"field_number",
                "name":"G",
                "value":0,
                "min":0,
                "max":255
            },
            {
                "type":"field_number",
                "name":"B",
                "value":0,
                "min":0,
                "max":255
            }
        ],
        "previousStatement":null,
        "nextStatement":null,
        "colour":"#FFAB19"
    },
    // 4. Show Strip
    {
        "type":"evive_show_strip",
        "message0":"Show Strip %1",
        "args0":[
            {
            "type":"field_number",
            "name":"STRIP_NUM",
            "value": 1,
            "min": 1
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour":"#FFAB19"
    },
    // LED Delay Block
    {
        "type": "evive_strip_effect_rgb",
        "message0":"%1 strip %2 with colour R%3 G%4 B%5 with Delay %6",
        "args0":[
            {
                "type":"field_dropdown",
                "name":"EFFECT",
                "options":[
                    ["Colour Wipe","Colour Wipe"],
                    ["Theatre Chase", "Theatre Chase"],
                    ["Rainbow Cycle", "Rainbow Cycle"],
                    ["Rainbow Chase", "Rainbow Chase"],
                    ["Fill", "Fill"]
                ],
            },
            {
                "type":"field_number",
                "name":"STRIP_NUM",
                "value":1,
                "min":1
            },
            {
                "type":"field_number",
                "name":"R",
                "value":255,
                "min":0,
                "max":255
            },
            {
                "type":"field_number",
                "name":"G",
                "value":0,
                "min":0,
                "max":255
            },
            {
                "type":"field_number",
                "name":"B",
                "value":0,
                "min":0,
                "max":255
            },
            {
                "type":"field_number",
                "name":"DELAY",
                "value":10,
                "min":0,
                "max":60
            }
        ],
        "previousStatement":null,
        "nextStatement":null,
        "colour":"#FFAB19"
    },

    // 6. {Dropdown} strip {1} with delay {200} ms
    {
        "type":"evive_strip_effect_pattern",
        "message0":"%1 strip %2 with delay %3 ms",
        "args0":[
            {
                "type":"field_dropdown",
                "name":"EFFECT",
                "options":[
                    ["Colour Wipe","Colour Wipe"],
                    ["Theatre Chase", "Theatre Chase"],
                    ["Rainbow Cycle", "Rainbow Cycle"],
                    ["Rainbow Chase", "Rainbow Chase"],
                    ["Fill", "Fill"]
                ],
            },
            {
                "type":"field_number",
                "name":"STRIP_NUM",
                "value":1,
                "min":1
            },
            {
                "type":"field_number",
                "name":"DELAY",
                "value":200,
                "min":0,
                "max":60
            }
        ],
        "previousStatement":null,
        "nextStatement":null,
        "colour":"#FFAB19"
    }


])





