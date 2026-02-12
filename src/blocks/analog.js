import * as blockly from "blockly";

blockly.common.defineBlocksWithJsonArray([
    {
        "type": "analog_write",
        "message0": "analog write pin %1 value %2",
        "args0": [{
            "type": "field_number",
            "name": "PIN",
            "value": 9,
            "min": 0,
            "max": 255
        }, {
            "type": "field_number",
            "value": 128,
            "min": 0,
            "max": 255
        }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#E64C3C",
        "tooltip": "Write a value to an analog pin"
    },
    {
        "type": "analog_read",
        "message0": "analog read pin %1",
        "args0":[{
            "type":"field_dropdown",
            "name":"PIN",
            "options":[
                ["A0"],
                ["A1"],
                ["A2"],
                ["A3"],
                ["A4"],
                ["A5"]
            ] 
        }],
        "output":"Number",
        "colour":"#E64C3C",
        "tooltip":"Read the analog value of a pin"
    }
])









