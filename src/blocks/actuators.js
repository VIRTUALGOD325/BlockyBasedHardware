import * as blockly from "blockly"

blockly.common.defineBlocksWithJsonArray([
    {
        "type": "set_servo_angle",
        "message0": "set servo on pin %1 to %2 degrees",
        "args0": [
            { "type": "input_value", "name": "PIN" },
            { "type": "input_value", "name": "ANGLE" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF"
    },
    {
        "type": "servo_read",
        "message0": "read servo angle on pin %1",
        "args0": [
            { "type": "input_value", "name": "PIN" }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#9966FF"
    },
    {
        "type": "servo_detach",
        "message0": "detach servo on pin %1",
        "args0": [
            { "type": "input_value", "name": "PIN" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF"
    },
    {
        "type": "set_motor_speed",
        "message0": "set motor EN %1 IN1 %2 IN2 %3 speed %4",
        "args0": [
            { "type": "input_value", "name": "EN" },
            { "type": "input_value", "name": "IN1" },
            { "type": "input_value", "name": "IN2" },
            { "type": "input_value", "name": "SPEED" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF"
    },
    {
        "type": "set_neopixel",
        "message0": "NeoPixel pin %1 LED# %2 R %3 G %4 B %5",
        "args0": [
            { "type": "input_value", "name": "PIN" },
            { "type": "input_value", "name": "LED" },
            { "type": "input_value", "name": "R" },
            { "type": "input_value", "name": "G" },
            { "type": "input_value", "name": "B" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19"
    }
]);
