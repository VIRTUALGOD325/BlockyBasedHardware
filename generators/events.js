import { arduinoGen } from './arduino';

// Arduino Start — blocks connected below this go into setup(), not loop()
arduinoGen.forBlock['arduino_start'] = function (block) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock) {
        // Generate the entire chain below arduino_start and place it in setup()
        const chainCode = arduinoGen.blockToCode(nextBlock);
        if (typeof chainCode === 'string') {
            arduinoGen.setupCode_['arduino_start_user'] = chainCode;
        }
    }
    // Return empty — scrub_ is overridden to not follow next for this block
    return '';
};
