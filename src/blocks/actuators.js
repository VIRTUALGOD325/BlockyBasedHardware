import * as blockly from "blockly"

blockly.common.defineBlocksWithJsonArray([
    {
        "type": "set_servo_angle",
        "message0": "set servo on pin %1 to %2 degrees",
        "args0": [{
            "type": "field_value",
            "default": 9
        }, {
            "type": "field_value",
            "default": 90,
            "min": 0,
            "max": 180
        }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#F39C12"
    },
    {
        "type": "set_motor_speed",
        "message0": "set motor EN %1 IN1 %2 IN2 %3 speed %4",
        "args0":[
            {
                "type": "field_value",
                "default": 5
            },
            {
                "type": "field_value",
                "default": 6
            },
            {
                "type": "field_value",
                "default": 7
            },
            {
                "type": "field_value",
                "default": 200,
                "min": 0,
                "max": 255
            }
        ],
        "previousStatement":null,
        "nextStatement": null,
        "colour": "#F39C12"

    },
    {
        "type":"set_neopixel",
        "message0":"NeoPixel pin %1 LED# %2 R %3 G %4 B %5",
        "args0": [{
                "type": "field_value",
                "default": 6
            },
            {
                "type": "field_value",
                "default": 0
            },
            {
                "type": "field_value",
                "default": 255,
                "min": 0,
                "max": 255
            },
            {
                "type": "field_value",
                "default": 0,
                "min": 0,
                "max": 255
            },
            {
                "type": "field_value",
                "default": 0,
                "min": 0,
                "max": 255
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#F39C12"
    }
]);
