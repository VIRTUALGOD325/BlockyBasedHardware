export default {
    kind: "categoryToolbox",
    contents: [
        // ─── Pin ───
        {
            kind: "category",
            name: "🔵 Pin",
            colour: "#FF6680",
            contents: [
                { kind: "block", type: "set_pin_mode" },
                { kind: "block", type: "digital_write" },
                { kind: "block", type: "digital_read" },
                { kind: "block", type: "analog_write" },
                { kind: "block", type: "analog_read" },
                { kind: "block", type: "pulse_in" },
                { kind: "block", type: "led_control" },
                { kind: "block", type: "play_tone" },
                { kind: "block", type: "suspend_pin" },
                { kind: "block", type: "do_not_suspend_pin" },
            ]
        },

        // ─── Actuators ───
        {
            kind: "category",
            name: "🟠 Actuators",
            colour: "#FFAB19",
            contents: [
                { kind: "block", type: "set_servo_angle" },
                { kind: "block", type: "set_motor_speed" },
                { kind: "block", type: "set_neopixel" },
            ]
        },

        // ─── Serial Port ───
        {
            kind: "category",
            name: "🟢 Serial Port",
            colour: "#00979D",
            contents: [
                { kind: "block", type: "serial_begin" },
                {
                    kind: "block",
                    type: "serial_print",
                    inputs: {
                        VALUE: {
                            shadow: { type: "text", fields: { TEXT: "hello" } }
                        }
                    }
                },
                {
                    kind: "block",
                    type: "serial_println",
                    inputs: {
                        VALUE: {
                            shadow: { type: "text", fields: { TEXT: "hello" } }
                        }
                    }
                },
                { kind: "block", type: "serial_available" },
                { kind: "block", type: "serial_read" },
                { kind: "block", type: "serial_read_string" },
            ]
        },

        // ─── Data ───
        {
            kind: "category",
            name: "🟣 Data",
            colour: "#8B5CF6",
            contents: [
                {
                    kind: "block",
                    type: "map_value",
                    inputs: {
                        VALUE: { shadow: { type: "math_number", fields: { NUM: 50 } } },
                        FROM_LOW: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                        FROM_HIGH: { shadow: { type: "math_number", fields: { NUM: 100 } } },
                        TO_LOW: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                        TO_HIGH: { shadow: { type: "math_number", fields: { NUM: 1000 } } }
                    }
                },
                {
                    kind: "block",
                    type: "constrain_value",
                    inputs: {
                        VALUE: { shadow: { type: "math_number", fields: { NUM: 50 } } },
                        MIN: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                        MAX: { shadow: { type: "math_number", fields: { NUM: 100 } } }
                    }
                },
                {
                    kind: "block",
                    type: "convert_to_type",
                    inputs: {
                        VALUE: { shadow: { type: "math_number", fields: { NUM: 123 } } }
                    }
                },
                { kind: "block", type: "ascii_char" },
                { kind: "block", type: "ascii_num" },
            ]
        },

        // ─── Sensor ───
        {
            kind: "category",
            name: "🔵 Sensor",
            colour: "#4CBFE6",
            contents: [
                { kind: "block", type: "read_ultrasonic" },
                { kind: "block", type: "read_dht" },
                { kind: "block", type: "read_ir" },
                { kind: "block", type: "timer" },
                { kind: "block", type: "reset_timer" },
            ]
        },

        // ─── Events ───
        {
            kind: "category",
            name: "🟡 Events",
            colour: "#FFBF00",
            contents: [
                { kind: "block", type: "arduino_start" },
            ]
        },

        // ─── Control ───
        {
            kind: "category",
            name: "🟠 Control",
            colour: "#FFAB19",
            contents: [
                { kind: "block", type: "controls_repeat_ext" },
                { kind: "block", type: "controls_whileUntil" },
                { kind: "block", type: "controls_if" },
                { kind: "block", type: "delay_ms" },
                { kind: "block", type: "delay_us" },
            ]
        },

        // ─── Operators ───
        {
            kind: "category",
            name: "🟢 Operators",
            colour: "#59C059",
            contents: [
                { kind: "block", type: "math_arithmetic" },
                { kind: "block", type: "math_random_int" },
                { kind: "block", type: "logic_compare" },
                { kind: "block", type: "logic_operation" },
                { kind: "block", type: "logic_negate" },
                { kind: "block", type: "math_number" },
                { kind: "block", type: "text" },
                { kind: "block", type: "text_join" },
            ]
        },


        // ─── Variables ───
        {
            kind: "category",
            name: "🟠 Variables",
            colour: "#FF8C1A",
            custom: "VARIABLE"
        },

        // ─── My Blocks ───
        {
            kind: "category",
            name: "🔴 My Blocks",
            colour: "#FF6680",
            custom: "PROCEDURE"
        }
    ]
};
