export default {
    kind: "categoryToolbox",
    contents: [
        // ─── Events ───
        {
            kind: "category",
            name: "Events",
            colour: "#FFAB19",
            contents: [
                { kind: "block", type: "arduino_start" },
            ]
        },

        // ─── Control ───
        {
            kind: "category",
            name: "Control",
            colour: "#FFAB19",
            contents: [
                { kind: "block", type: "forever_loop" },
                {
                    kind: "block",
                    type: "arduino_repeat",
                    inputs: {
                        TIMES: {
                            shadow: { type: "math_number", fields: { NUM: 10 } }
                        }
                    }
                },
                {
                    kind: "block",
                    type: "arduino_while_until",
                    inputs: {
                        BOOL: {
                            shadow: { type: "logic_boolean", fields: { BOOL: "TRUE" } }
                        }
                    }
                },
                { kind: "block", type: "arduino_if" },
                { kind: "block", type: "arduino_if_else" },
                { kind: "block", type: "break" },
                { kind: "block", type: "wait_seconds" },
                { kind: "block", type: "delay_ms" },
            ]
        },

        // ─── Pin ───
        {
            kind: "category",
            name: "Pin",
            colour: "#4C97FF",
            contents: [
                { kind: "block", type: "analog_read" },
                { kind: "block", type: "digital_read" },
                { kind: "block", type: "set_pin_mode" },
                { kind: "block", type: "digital_write" },
                { kind: "block", type: "analog_write" },
                { kind: "block", type: "servo_write" },
                { kind: "block", type: "led_control" },
                { kind: "block", type: "play_tone" },
                { kind: "block", type: "suspend_pin" },
                { kind: "block", type: "do_not_suspend_pin" },
                { kind: "block", type: "pulse_in" },
            ]
        },

        // ─── Actuators ───
        {
            kind: "category",
            name: "Actuators",
            colour: "#9966FF",
            contents: [
                {
                    kind: "block", type: "set_servo_angle",
                    inputs: {
                        ANGLE: { shadow: { type: "math_number", fields: { NUM: 90 } } }
                    }
                },
                { kind: "block", type: "servo_read" },
                { kind: "block", type: "servo_detach" },
                { kind: "block", type: "set_motor_speed" },
                { kind: "block", type: "set_neopixel" },
            ]
        },

        // ─── Sensor ───
        {
            kind: "category",
            name: "Sensor",
            colour: "#5CB1D6",
            contents: [
                // Stack blocks (rectangular)
                { kind: "block", type: "read_ir" },
                { kind: "block", type: "ir_resume" },
                { kind: "block", type: "reset_timer" },
                // Reporter blocks (rounded/oval)
                { kind: "block", type: "read_ultrasonic" },
                { kind: "block", type: "read_dht" },
                { kind: "block", type: "ir_result_available" },
                { kind: "block", type: "ir_get_value" },
                { kind: "block", type: "ir_key_code" },
                { kind: "block", type: "timer" },
            ]
        },

        // ─── Serial ───
        {
            kind: "category",
            name: "Serial",
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

        // ─── Operators ───
        {
            kind: "category",
            name: "Operators",
            colour: "#59C059",
            contents: [
                {
                    kind: "block", type: "math_arithmetic",
                    inputs: {
                        A: { shadow: { type: "math_number", fields: { NUM: 0 } } },
                        B: { shadow: { type: "math_number", fields: { NUM: 0 } } }
                    }
                },
                {
                    kind: "block", type: "math_random_int",
                    inputs: {
                        FROM: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                        TO:   { shadow: { type: "math_number", fields: { NUM: 10 } } }
                    }
                },
                {
                    kind: "block", type: "logic_compare",
                    inputs: {
                        A: { shadow: { type: "math_number", fields: { NUM: 0 } } },
                        B: { shadow: { type: "math_number", fields: { NUM: 0 } } }
                    }
                },
                {
                    kind: "block", type: "logic_operation",
                    inputs: {
                        A: { shadow: { type: "logic_boolean", fields: { BOOL: "TRUE" } } },
                        B: { shadow: { type: "logic_boolean", fields: { BOOL: "TRUE" } } }
                    }
                },
                {
                    kind: "block", type: "logic_negate",
                    inputs: {
                        BOOL: { shadow: { type: "logic_boolean", fields: { BOOL: "TRUE" } } }
                    }
                },
                { kind: "block", type: "logic_boolean" },
                { kind: "block", type: "math_number" },
                {
                    kind: "block", type: "math_modulo",
                    inputs: {
                        DIVIDEND: { shadow: { type: "math_number", fields: { NUM: 10 } } },
                        DIVISOR:  { shadow: { type: "math_number", fields: { NUM: 3 } } }
                    }
                },
                {
                    kind: "block", type: "math_constrain",
                    inputs: {
                        VALUE: { shadow: { type: "math_number", fields: { NUM: 50 } } },
                        LOW:   { shadow: { type: "math_number", fields: { NUM: 0 } } },
                        HIGH:  { shadow: { type: "math_number", fields: { NUM: 100 } } }
                    }
                },
                { kind: "block", type: "text" },
                { kind: "block", type: "text_join" },
            ]
        },

        // ─── Data ───
        {
            kind: "category",
            name: "Data",
            colour: "#9966FF",
            contents: [
                // Typed variable declarations
                {
                    kind: "block", type: "declare_int",
                    inputs: { VALUE: { shadow: { type: "math_number", fields: { NUM: 0 } } } }
                },
                {
                    kind: "block", type: "declare_float",
                    inputs: { VALUE: { shadow: { type: "math_number", fields: { NUM: 0.0 } } } }
                },
                {
                    kind: "block", type: "declare_string",
                    inputs: { VALUE: { shadow: { type: "text", fields: { TEXT: "" } } } }
                },
                // Arrays
                { kind: "block", type: "declare_array_1d" },
                { kind: "block", type: "declare_array_2d" },
                {
                    kind: "block", type: "array_get",
                    inputs: { INDEX: { shadow: { type: "math_number", fields: { NUM: 0 } } } }
                },
                {
                    kind: "block", type: "array_set",
                    inputs: {
                        INDEX: { shadow: { type: "math_number", fields: { NUM: 0 } } },
                        VALUE: { shadow: { type: "math_number", fields: { NUM: 0 } } }
                    }
                },
                {
                    kind: "block", type: "array_get_2d",
                    inputs: {
                        ROW: { shadow: { type: "math_number", fields: { NUM: 0 } } },
                        COL: { shadow: { type: "math_number", fields: { NUM: 0 } } }
                    }
                },
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

        // ─── Evive RGB ───
        {
            kind: "category",
            name: "RGB",
            colour: "#FFAB19",
            contents: [
                { kind: "block", type: "evive_program" },
                { kind: "block", type: "evive_init_strip" },
                { kind: "block", type: "evive_set_pixel_colour" },
                { kind: "block", type: "evive_show_strip" },
                { kind: "block", type: "evive_strip_effect_rgb" },
                { kind: "block", type: "evive_strip_effect_pattern" },
            ]
        },

        // ─── Variables ───
        {
            kind: "category",
            name: "Variables",
            colour: "#FF8C1A",
            custom: "VARIABLE"
        },

        // ─── My Blocks ───
        {
            kind: "category",
            name: "My Blocks",
            colour: "#FF6680",
            custom: "PROCEDURE"
        }
    ]
};
