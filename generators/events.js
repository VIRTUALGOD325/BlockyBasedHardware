import { arduinoGen } from './arduino';

// Arduino Start
arduinoGen.forBlock['arduino_start'] = function (_block) {
    // This block is a hat block, usually code inside it goes to setup() or main loop structure.
    // However, in our generator structure, blocks connected to it will be generated via statementToCode.
    // Since 'arduino_start' often serves as a visual entry point, it might not generate code itself
    // but ensures the subsequent blocks are processed.

    // If it wraps setup code:
    // const setupBranch = arduinoGen.statementToCode(block, 'DO');
    // return setupBranch;

    // But based on the image, it has a "next" connection.
    // In many Blockly-Arduino implementations, the workspace is traversed to find top-level blocks.
    // If this block is just a wrapper for "setup", we might need to handle it specially in the main generator loop.
    // For now, we'll return an empty string, assuming the connected blocks will be generated
    // as part of the main execution flow if they are connected to 'next'.
    // NOTE: If the generator only iterates over top-level blocks and this is one,
    // we need to make sure we call `start` on the next block.

    // Standard Blockly behavior: return the code for next blocks.
    // The generator's `workspaceToCode` (or `blockToCode`) handles the 'next' block automatically
    // by appending detailed in `scrub_`.
    // So if this block produces no code, `scrub_` will still produce the code for the next block.

    return '// Arduino Start\n';
};
