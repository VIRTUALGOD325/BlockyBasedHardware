// //Pins to ADD:
// //Read Digital PIN (INput) Def-9
// // Read Analog PIN (A) Def-0
// // Read pulse Pin def-13 timeout 2000
// // set digital pin def-9 output as Options High/Low 
// // Set PWM def-5 output 0-255 
// // play pin def-9 with note Options def-C4 for duration def-1
// set servo pin def-9 to angle def-90
// Repeat Block suspend pin def-9 mode Options Rising end
// donot suspend pin options 0-9 Def-2 

import * as Blockly from 'blockly';
Blockly.common.defineBlocksWithJsonArray([
    {
        "type": "set_pin_mode",
        "message0": "set pin %1 as %2",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 13,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_dropdown",
                "name": "MODE",
                "options": [
                    ["INPUT", "INPUT"],
                    ["OUTPUT", "OUTPUT"],
                    ["INPUT_PULLUP", "INPUT_PULLUP"]
                ]
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Configure a pin as either an INPUT or OUTPUT"
    },
    {
        "type": "digital_write",
        "message0": "digital write pin %1 to %2",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 13,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_dropdown",
                "name": "VALUE",
                "options": [
                    ["HIGH", "HIGH"],
                    ["LOW", "LOW"]
                ]
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Set a digital pin HIGH or LOW"
    },
    {
        "type": "digital_read",
        "message0": "digital read pin %1",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 2,
                "min": 0,
                "max": 53
            }
        ],
        "output": "Number",
        "colour": "#FF6680",
        "tooltip": "Read the digital value of a pin (HIGH or LOW)"
    },
    {
        "type": "led_control",
        "message0": "set LED on pin %1 %2",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 13,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_dropdown",
                "name": "STATE",
                "options": [
                    ["ON", "HIGH"],
                    ["OFF", "LOW"]
                ]
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Turn an LED on or off on the specified pin"
    },
    {
        "type": "analog_read",
        "message0": "analog read pin %1",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 0,
                "min": 0,
                "max": 15
            }
        ],
        "output": "Number",
        "colour": "#FF6680",
        "tooltip": "Read the value from an analog pin (0-1023)"
    },
    {
        "type": "pulse_in",
        "message0": "read pulse from pin %1 value %2 timeout %3",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 13,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_dropdown",
                "name": "VALUE",
                "options": [
                    ["HIGH", "HIGH"],
                    ["LOW", "LOW"]
                ]
            },
            {
                "type": "field_number",
                "name": "TIMEOUT",
                "value": 2000,
                "min": 0
            }
        ],
        "output": "Number",
        "colour": "#FF6680",
        "tooltip": "Read a pulse (HIGH or LOW) on a pin"
    },
    {
        "type": "analog_write",
        "message0": "set PWM pin %1 to %2",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 5,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_number",
                "name": "VALUE",
                "value": 0,
                "min": 0,
                "max": 255
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Write an analog value (PWM wave) to a pin"
    },
    {
        "type": "play_tone",
        "message0": "play tone on pin %1 note %2 duration %3",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 9,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_dropdown",
                "name": "NOTE",
                "options": [
                    ["C4 (261 Hz)", "261"],
                    ["D4 (294 Hz)", "294"],
                    ["E4 (329 Hz)", "329"],
                    ["F4 (349 Hz)", "349"],
                    ["G4 (392 Hz)", "392"],
                    ["A4 (440 Hz)", "440"],
                    ["B4 (493 Hz)", "493"],
                    ["C5 (523 Hz)", "523"]
                ]
            },
            {
                "type": "field_number",
                "name": "DURATION",
                "value": 1000,
                "min": 0
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Play a tone on a pin"
    },
    {
        "type": "servo_write",
        "message0": "set servo pin %1 to angle %2",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 9,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_number",
                "name": "ANGLE",
                "value": 90,
                "min": 0,
                "max": 180
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Write an angle to a servo motor"
    },
    {

        "type": "suspend_pin",
        "message0": "suspend pin %1 mode %2 %3",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 2,
                "min": 0,
                "max": 53
            },
            {
                "type": "field_dropdown",
                "name": "MODE",
                "options": [
                    ["rising edge", "RISING"],
                    ["falling edge", "FALLING"],
                    ["change", "CHANGE"]
                ]
            },
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Attach an interrupt to a pin (Suspend Pin)"
    },
    {
        "type": "do_not_suspend_pin",
        "message0": "do not suspend pin %1",
        "args0": [
            {
                "type": "field_number",
                "name": "PIN",
                "value": 2,
                "min": 0,
                "max": 53
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF6680",
        "tooltip": "Detach an interrupt from a pin"
    }
])







