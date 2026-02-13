export default {
    kind: "categoryToolbox",
    contents: [
        // ─── Control Flow ───
        {
            kind: "category",
            name: "⚙️ Control",
            colour: "#4C97FF", // Scratch blue
            contents: [
                { kind: "block", type: "controls_repeat_ext" },
                { kind: "block", type: "controls_whileUntil" },
                { kind: "block", type: "controls_if" },
                { kind: "block", type: "delay_ms" },
                { kind: "block", type: "delay_us" },
            ]
        },

        // ─── Separator ───
        { kind: "sep" },

        // ─── GPIO Pins ───
        {
            kind: "category",
            name: "🔌 GPIO Pins",
            colour: "#FF6680", // Scratch red/pink
            contents: [
                { kind: "block", type: "set_pin_mode" },
                { kind: "block", type: "digital_write" },
                { kind: "block", type: "digital_read" },
                { kind: "block", type: "analog_write" },
                { kind: "block", type: "analog_read" },
            ]
        },

        // ─── Sensors ───
        {
            kind: "category",
            name: "📡 Sensors",
            colour: "#4CBFE6", // Scratch cyan/light blue
            contents: [
                { kind: "block", type: "read_ultrasonic" },
                { kind: "block", type: "read_dht" },
                { kind: "block", type: "read_ir" },
            ]
        },

        // ─── Actuators ───
        {
            kind: "category",
            name: "🎛️ Actuators",
            colour: "#FFAB19", // Scratch orange
            contents: [
                { kind: "block", type: "set_servo_angle" },
                { kind: "block", type: "set_motor_speed" },
                { kind: "block", type: "set_neopixel" },
            ]
        },

        // ─── Separator ───
        { kind: "sep" },

        // ─── Variables ───
        {
            kind: "category",
            name: "📦 Variables",
            colour: "#8B5CF6", // Purple - creative and vibrant
            custom: "VARIABLE"
        },

        // ─── Functions ───
        {
            kind: "category",
            name: "⚡ Functions",
            colour: "#8B5CF6", // Purple - matches variables for consistency
            custom: "PROCEDURE"
        },

        // ─── Separator ───
        { kind: "sep" },

        // ─── Math ───
        {
            kind: "category",
            name: "🔢 Math",
            colour: "#59C059", // Scratch green
            contents: [
                { kind: "block", type: "math_number" },
                { kind: "block", type: "math_arithmetic" },
                { kind: "block", type: "math_constrain" },
                { kind: "block", type: "math_random_int" },
                { kind: "block", type: "math_modulo" },
            ]
        },

        // ─── Logic ───
        {
            kind: "category",
            name: "🧠 Logic",
            colour: "#59C059", // Scratch green
            contents: [
                { kind: "block", type: "logic_compare" },
                { kind: "block", type: "logic_operation" },
                { kind: "block", type: "logic_negate" },
                { kind: "block", type: "logic_boolean" },
            ]
        },
    ]
};
