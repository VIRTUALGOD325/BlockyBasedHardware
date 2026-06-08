// Self register thanks to defineblocksarray func

import './pins';
import './timing';
import './data';
import './sensors';
import './actuators';
import './events';
import './serial';
import './evive';

import { Blocks, FieldDropdown } from 'blockly';

// Override logic_compare to accept any type on both sides (Number AND Boolean).
// Blockly's built-in version enforces type matching once one side is connected,
// which prevents mixing digital_read (Number) with true/false (Boolean).
Blocks['logic_compare'] = {
  init: function () {
    this.appendValueInput('A').setCheck(null);
    this.appendDummyInput().appendField(
      new FieldDropdown([
        ['=', 'EQ'], ['≠', 'NEQ'],
        ['<', 'LT'], ['≤', 'LTE'],
        ['>', 'GT'], ['≥', 'GTE'],
      ]), 'OP'
    );
    this.appendValueInput('B').setCheck(null);
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setColour('#59C059');
    this.setTooltip('Compare two values');
  }
};

// Patch variables_set so its VALUE input accepts any type (number, boolean, etc.)
// Without this, Blockly can silently restrict the input type based on context.
const varSetDef = Blocks['variables_set'];
if (varSetDef) {
  const origVarSetInit = varSetDef.init;
  varSetDef.init = function () {
    if (origVarSetInit) origVarSetInit.call(this);
    const valueInput = this.getInput('VALUE');
    if (valueInput) valueInput.setCheck(null);
  };
}

// Patch procedures_ifreturn so it works outside procedure definitions.
// Blockly's built-in onchange handler disables this block when it's not
// inside a procedures_defnoreturn/procedures_defreturn, which causes code
// generation to produce nothing. We override onchange to only show a
// warning (not disable) so the block still generates valid Arduino code.

const ifReturnDef = Blocks['procedures_ifreturn'];
if (ifReturnDef) {
  const origOnChange = ifReturnDef.onchange;
  ifReturnDef.onchange = function (e) {
    // Run the original handler (sets warning text, adjusts return value input)
    if (origOnChange) origOnChange.call(this, e);
    // Re-enable the block — we allow it outside procedure definitions
    if (typeof this.setDisabledReason === 'function') {
      // Clear all disabled reasons that Blockly may have set
      this.setDisabledReason(false, 'UNPARENTED_IFRETURN');
    }
    if (typeof this.setEnabled === 'function') {
      this.setEnabled(true);
    }
    this.setWarningText(null);
  };
}
