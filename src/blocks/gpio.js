import * as Blockly from "blockly";

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
    }
]);

