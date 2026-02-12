import * as Blockly from "blockly";
import toolbox from './toolBox'
import './blocks'
import { arduinoGen } from '../generators/arduino'
import '../generators'
import { useState, useEffect, useRef } from "react";

const App = () => {
  const [generatedCode, setGeneratedCode] = useState("");
  const [showCodePanel, setShowCodePanel] = useState(false);
  const workspaceRef = useRef(null);

  useEffect(() => {
    const workspace = Blockly.inject('blockly-div', {
      toolbox: toolbox,
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1.0 },
      trashcan: true,
      theme: Blockly.Themes.Dark,
    });
    workspaceRef.current = workspace;

    return () => {
      workspace.dispose();
    };
  }, []);

  const handleGenerateCode = () => {
    if (!workspaceRef.current) return;
    const code = arduinoGen.workspaceToCode(workspaceRef.current);
    setGeneratedCode(code);
    setShowCodePanel(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  return (
    <div>
      <div id="blockly-div" style={{ height: '90vh', width: '100vw' }} />
      <button onClick={handleGenerateCode}>Generate Code</button>
      {showCodePanel && (
        <div>
          <button onClick={handleCopyCode}>Copy Code</button>
          <pre>{generatedCode}</pre>
        </div>
      )}
    </div>
  );
};

export default App