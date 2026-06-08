import * as blockly from "blockly";

blockly.common.defineBlocksWithJsonArray([
    // ── forever_loop: label on top, body below (mblock style) ──────────
    {
        "type": "forever_loop",
        "message0": "forever",
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "previousStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Repeat the enclosed blocks forever"
    },

    // ── arduino_repeat: repeat N times, no "do" label ──────────────────
    {
        "type": "arduino_repeat",
        "message0": "repeat %1 times %2",
        "args0": [
            { "type": "input_value", "name": "TIMES", "check": "Number" },
            { "type": "input_statement", "name": "DO" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Repeat the enclosed blocks N times"
    },

    // ── arduino_while_until: repeat while/until, no "do" label ─────────
    {
        "type": "arduino_while_until",
        "message0": "repeat %1 %2 %3",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MODE",
                "options": [["while", "WHILE"], ["until", "UNTIL"]]
            },
            { "type": "input_value", "name": "BOOL", "check": "Boolean" },
            { "type": "input_statement", "name": "DO" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Repeat while/until a condition is true"
    },

    // ── arduino_if: if with no "do" and no mutator ─────────────────────
    {
        "type": "arduino_if",
        "message0": "if %1 %2",
        "args0": [
            { "type": "input_value", "name": "IF0", "check": "Boolean" },
            { "type": "input_statement", "name": "DO0" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Run blocks if condition is true"
    },

    // ── arduino_if_else: if-else with no "do" and no mutator ───────────
    {
        "type": "arduino_if_else",
        "message0": "if %1 %2",
        "args0": [
            { "type": "input_value", "name": "IF0", "check": "Boolean" },
            { "type": "input_statement", "name": "DO0" }
        ],
        "message1": "else %1",
        "args1": [{ "type": "input_statement", "name": "ELSE" }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Run one set of blocks if condition is true, otherwise run another"
    },

    // ── wait_seconds: decimal seconds (replaces microseconds block) ─────
    {
        "type": "wait_seconds",
        "message0": "wait %1 seconds",
        "args0": [{
            "type": "field_number",
            "name": "TIME",
            "value": 1,
            "min": 0
        }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Wait for a number of seconds (decimals supported, e.g. 0.5 = 500ms)"
    },

    // ── delay_ms: updated to allow decimal milliseconds ─────────────────
    {
        "type": "delay_ms",
        "message0": "wait %1 milliseconds",
        "args0": [{
            "type": "field_number",
            "name": "TIME",
            "value": 1000,
            "min": 0
        }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Wait for a number of milliseconds (decimals map to microseconds)"
    },

    // ── delay_us: kept for loading old saved files ──────────────────────
    {
        "type": "delay_us",
        "message0": "wait %1 microseconds",
        "args0": [{
            "type": "field_number",
            "name": "TIME",
            "value": 100,
            "min": 0
        }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Wait for a number of microseconds"
    },

    // ── wait_until: polls condition every 10 ms ──────────────────────────
    {
        "type": "wait_until",
        "message0": "wait until %1",
        "args0": [
            { "type": "input_value", "name": "BOOL", "check": "Boolean" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Wait until the condition becomes true (checks every 10 ms)"
    },

    // ── break ────────────────────────────────────────────────────────────
    {
        "type": "break",
        "message0": "break",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FFAB19",
        "tooltip": "Exit the current loop immediately"
    }
]);
