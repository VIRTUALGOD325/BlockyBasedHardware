import { arduinoGen, Order } from "./arduino";

// ── C++ helper function templates for NeoPixel effects ──
// These get injected into definitions_ so they appear before setup()/loop()

const EFFECT_FUNCTIONS = {
    colorWipe: `void colorWipe(Adafruit_NeoPixel &strip, uint32_t color, int wait) {
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, color);
    strip.show();
    delay(wait);
  }
}`,
    theaterChase: `void theaterChase(Adafruit_NeoPixel &strip, uint32_t color, int wait) {
  for (int a = 0; a < 10; a++) {
    for (int b = 0; b < 3; b++) {
      strip.clear();
      for (int c = b; c < strip.numPixels(); c += 3) {
        strip.setPixelColor(c, color);
      }
      strip.show();
      delay(wait);
    }
  }
}`,
    rainbowCycle: `uint32_t Wheel(Adafruit_NeoPixel &strip, byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if (WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

void rainbowCycle(Adafruit_NeoPixel &strip, int wait) {
  for (int j = 0; j < 256 * 5; j++) {
    for (int i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel(strip, ((i * 256 / strip.numPixels()) + j) & 255));
    }
    strip.show();
    delay(wait);
  }
}`,
    rainbowChase: `void rainbowChase(Adafruit_NeoPixel &strip, int wait) {
  for (long firstPixelHue = 0; firstPixelHue < 5 * 65536; firstPixelHue += 256) {
    for (int a = 0; a < 3; a++) {
      strip.clear();
      for (int c = a; c < strip.numPixels(); c += 3) {
        int hue = firstPixelHue + c * 65536L / strip.numPixels();
        uint32_t color = strip.gamma32(strip.ColorHSV(hue));
        strip.setPixelColor(c, color);
      }
      strip.show();
      delay(wait);
    }
  }
}`,
    fill: `void fill(Adafruit_NeoPixel &strip, uint32_t color, int wait) {
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, color);
  }
  strip.show();
  delay(wait);
}`
};

// Helper: inject a C++ effect function definition if not already added
function injectEffect(effectName) {
    if (EFFECT_FUNCTIONS[effectName]) {
        arduinoGen.definitions_[`effect_${effectName}`] = EFFECT_FUNCTIONS[effectName];
    }
}

// ── Block Generators ──

// 1. Evive Program
arduinoGen.forBlock['evive_program'] = function (block) {
    return '// Evive Program Start\n';
};

// 2. Init Strip
arduinoGen.forBlock['evive_init_strip'] = function (block) {
    const stripNum = block.getFieldValue('STRIP_NUM');
    const numLeds = block.getFieldValue('NUM_LEDS');
    const pin = block.getFieldValue('PIN');

    arduinoGen.includes_['neo_lib'] = '#include <Adafruit_NeoPixel.h>';
    arduinoGen.variables_[`strip_${stripNum}`] = `Adafruit_NeoPixel strip_${stripNum} = Adafruit_NeoPixel(${numLeds}, ${pin}, NEO_GRB + NEO_KHZ800);`;
    arduinoGen.setupCode_[`setup_strip_${stripNum}`] = `strip_${stripNum}.begin();\n  strip_${stripNum}.show();`;
    return '';
};

// 3. Set Pixel Colour
arduinoGen.forBlock['evive_set_pixel_colour'] = function (block) {
    const stripNum = block.getFieldValue('STRIP_NUM');
    const index = block.getFieldValue('LED_NUM');
    const r = block.getFieldValue('R');
    const g = block.getFieldValue('G');
    const b = block.getFieldValue('B');
    return `strip_${stripNum}.setPixelColor(${index} - 1, strip_${stripNum}.Color(${r}, ${g}, ${b}));\n`;
};

// 4. Show Strip
arduinoGen.forBlock['evive_show_strip'] = function (block) {
    const stripNum = block.getFieldValue('STRIP_NUM');
    return `strip_${stripNum}.show();\n`;
};

// 5. RGB Effects with Delay (colorWipe, theaterChase, fill)
arduinoGen.forBlock['evive_strip_effect_rgb'] = function (block) {
    const effect = block.getFieldValue('EFFECT');
    const stripNum = block.getFieldValue('STRIP_NUM');
    const r = block.getFieldValue('R');
    const g = block.getFieldValue('G');
    const b = block.getFieldValue('B');
    const delayTime = block.getFieldValue('DELAY');

    // Inject the C++ helper function for this effect
    injectEffect(effect);

    // If an old block has a pattern effect selected that doesn't take color arguments
    if (effect === 'rainbowCycle' || effect === 'rainbowChase') {
        return `${effect}(strip_${stripNum}, ${delayTime});\n`;
    }

    return `${effect}(strip_${stripNum}, strip_${stripNum}.Color(${r}, ${g}, ${b}), ${delayTime});\n`;
};

// 6. Pattern Effects with Delay (rainbowCycle, rainbowChase)
arduinoGen.forBlock['evive_strip_effect_pattern'] = function (block) {
    const effect = block.getFieldValue('EFFECT');
    const stripNum = block.getFieldValue('STRIP_NUM');
    const delayTime = block.getFieldValue('DELAY');

    // Inject the C++ helper function for this effect
    injectEffect(effect);

    // If an old block has a color effect selected that needs color arguments (fallback to off)
    if (effect === 'colorWipe' || effect === 'theaterChase' || effect === 'fill') {
        return `${effect}(strip_${stripNum}, strip_${stripNum}.Color(0, 0, 0), ${delayTime});\n`;
    }

    return `${effect}(strip_${stripNum}, ${delayTime});\n`;
};
