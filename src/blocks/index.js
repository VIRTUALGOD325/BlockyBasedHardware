// Self register thanks to defineblocksarray func

import './pins';
import './timing';
import './data';
import './sensors';
import './actuators';
import './events';
import './serial';
import './evive';

// Patch procedures_ifreturn so it works outside procedure definitions.
// Blockly's built-in onchange handler disables this block when it's not
// inside a procedures_defnoreturn/procedures_defreturn, which causes code
// generation to produce nothing. We override onchange to only show a
// warning (not disable) so the block still generates valid Arduino code.
import { Blocks } from 'blockly';

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
