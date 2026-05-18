import { Generator, Names } from "blockly";

// Define operator precedence for Arduino (similar to C++)
const Order = {
  ATOMIC: 0,           // 0 "" ...
  NEW: 1.1,            // new
  MEMBER: 1.2,         // . []
  FUNCTION_CALL: 2,    // ()
  INCREMENT: 3,        // ++
  DECREMENT: 3,        // --
  BITWISE_NOT: 4.1,    // ~
  UNARY_PLUS: 4.2,     // +
  UNARY_NEGATION: 4.3, // -
  LOGICAL_NOT: 4.4,    // !
  TYPEOF: 4.5,         // typeof
  VOID: 4.6,           // void
  DELETE: 4.7,         // delete
  DIVISION: 5.1,       // /
  MULTIPLICATION: 5.2, // *
  MODULUS: 5.3,        // %
  SUBTRACTION: 6.1,    // -
  ADDITION: 6.2,       // +
  BITWISE_SHIFT: 7,    // << >> >>>
  RELATIONAL: 8,       // < <= > >=
  IN: 8,               // in
  INSTANCEOF: 8,       // instanceof
  EQUALITY: 9,         // == != === !==
  BITWISE_AND: 10,     // &
  BITWISE_XOR: 11,     // ^
  BITWISE_OR: 12,      // |
  LOGICAL_AND: 13,     // &&
  LOGICAL_OR: 14,      // ||
  CONDITIONAL: 15,     // ?:
  ASSIGNMENT: 16,      // = += -= *= /= %= <<= >>= ...
  COMMA: 17,           // ,
  NONE: 99             // (...)
};

const arduinoGen = new Generator("Arduino");
arduinoGen.includes_ = {};    // e.g. { "Servo": "#include <Servo.h>" }
arduinoGen.definitions_ = {}; // function definitions, ISRs, etc.
arduinoGen.setupCode_ = {};   // lines to go inside setup()
arduinoGen.variables_ = {};   // global variable declarations

/**
 * Blockly v12-compatible helper to get a safe variable name from an ID.
 * In v12, generator.getVariableName() does not exist — we must use nameDB_.
 */
arduinoGen.getVariableName = function (id) {
  // nameDB_ is created in init(). Guard against it not existing yet.
  if (this.nameDB_) {
    // Blockly v12 Names.getName expects (id, prefix)
    // The prefix 'VARIABLE' ensures collision-free names.
    return this.nameDB_.getName(id, 'VARIABLE');
  }
  // Fallback: if nameDB_ somehow isn't initialised, return the raw id
  return id;
};


//Overiding Core
arduinoGen.init = function (_workspace) {
  // Reset custom collections
  this.includes_ = {};
  this.definitions_ = {};
  this.setupCode_ = {};
  this.variables_ = {};

  // Names constructor takes a reserved-words string (comma-separated)
  // These are C/C++ reserved words that should not be used as variable names
  const reservedWords = 'setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,' +
    'define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,int,float,long,' +
    'double,char,boolean,byte,short,unsigned,void,string,String,NULL,sizeof,' +
    'analogRead,analogWrite,digitalRead,digitalWrite,pinMode,Serial,delay,millis,micros';
  this.nameDB_ = new Names(reservedWords);
};

arduinoGen.finish = function (code) {
  // Collect each section, filtering out empties for clean output
  const sections = [];

  const includesStr = Object.values(this.includes_ || {}).join("\n").trim();
  if (includesStr) sections.push(includesStr);

  const variablesStr = Object.values(this.variables_ || {}).join("\n").trim();
  if (variablesStr) sections.push(variablesStr);

  const definitionsStr = Object.values(this.definitions_ || {}).join("\n\n").trim();
  if (definitionsStr) sections.push(definitionsStr);

  const preamble = sections.length > 0 ? sections.join("\n\n") + "\n\n" : "";

  const setupStr = Object.values(this.setupCode_ || {}).join("\n  ").trim();

  return `${preamble}void setup() {
  ${setupStr}
}

void loop() {
  ${code}
}`;
};

arduinoGen.scrubNakedValue = function (line) {
  return line + ';\n';
};

arduinoGen.scrub_ = function (block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    const nextCode = arduinoGen.blockToCode(nextBlock);
    return code + nextCode;
  }
  return code;
};

// Generate code only from the arduino_start chain (goes into loop()) plus any
// procedure definition blocks (which are intentionally floating — they go into
// definitions_ via their own generators). All other floating blocks are ignored.
arduinoGen.workspaceToCode = function (workspace) {
  if (!workspace) return '';
  this.init(workspace);

  // Process procedure definitions first so they populate definitions_
  workspace.getTopBlocks(false).forEach((block) => {
    if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') {
      this.blockToCode(block);
    }
  });

  // Build loop() body from arduino_start chain only
  const startBlocks = workspace.getBlocksByType('arduino_start', false);
  if (startBlocks.length === 0) return this.finish('');

  const nextBlock = startBlocks[0].getNextBlock();
  const raw = nextBlock ? this.blockToCode(nextBlock) : '';
  const bodyCode = Array.isArray(raw) ? raw[0] : (raw || '');

  let result = this.finish(bodyCode);
  result = result.replace(/^\s+\n/, '\n');
  result = result.replace(/\n\n+/g, '\n\n');
  result = result.replace(/\n*$/, '\n');
  return result;
};

export { arduinoGen };
export { Order };
