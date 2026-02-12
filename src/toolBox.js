import { Toolbox } from "blockly";

export default {
    kind: "categoryToolbox",
    contents: [
        // ─── Control (blue) ───
        {
            kind: "category",
            name: "🟦 Control",
            colour: "#3498DB",
            contents: [
                { kind: "block", type: "controls_repeat_ext" },
                { kind: "block", type: "controls_whileUntil" },
                { kind: "block", type: "controls_if" },
                { kind: "block", type: "delay_ms" },
                { kind: "block", type: "delay_us" },
            ]
        },

        // ─── GPIO (red) ───
        {
            kind: "category",
            name: "🟥 GPIO",
            colour: "#E64C3C",
            contents: [
                { kind: "block", type: "set_pin_mode" },
                { kind: "block", type: "digital_write" },
                { kind: "block", type: "digital_read" },
                { kind: "block", type: "analog_write" },
                { kind: "block", type: "analog_read" },
            ]
        },

        // ─── Sensors (green) ───
        {
            kind: "category",
            name: "🟩 Sensors",
            colour: "#27AE60",
            contents: [
                { kind: "block", type: "read_ultrasonic" },
                { kind: "block", type: "read_dht" },
                { kind: "block", type: "read_ir" },
            ]
        },

        // ─── Actuators (yellow) ───
        {
            kind: "category",
            name: "🟨 Actuators",
            colour: "#F39C12",
            contents: [
                { kind: "block", type: "set_servo_angle" },
                { kind: "block", type: "set_motor_speed" },
                { kind: "block", type: "set_neopixel" },
            ]
        },

        // ─── Variables & Functions (purple) ───
        {
            kind: "category",
            name: "🟪 Variables",
            colour: "#8E44AD",
            custom: "VARIABLE"
        },
        {
            kind: "category",
            name: "🟪 Functions",
            colour: "#8E44AD",
            custom: "PROCEDURE"
        },

        // ─── Math & Logic (built-in) ───
        {
            kind: "category",
            name: "Math",
            colour: "#5B6EA6",
            contents: [
                { kind: "block", type: "math_number" },
                { kind: "block", type: "math_arithmetic" },
                { kind: "block", type: "math_constrain" },
                { kind: "block", type: "math_random_int" },
                { kind: "block", type: "math_modulo" },
            ]
        },
        {
            kind: "category",
            name: "Logic",
            colour: "#5B80A5",
            contents: [
                { kind: "block", type: "logic_compare" },
                { kind: "block", type: "logic_operation" },
                { kind: "block", type: "logic_negate" },
                { kind: "block", type: "logic_boolean" },
            ]
        },
    ]
};
