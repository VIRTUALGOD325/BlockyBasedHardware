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
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

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

  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket("ws://localhost:8765");
      ws.onopen = () => {
        setIsConnected(true);
      };

      // Event: Msg recv
      ws.onmessage = (event) => {
        try {
          const parsedMsg = JSON.parse(event.data);
          if (parsedMsg.type === "connected") {
            alert("Arduino Board Found!");
          } else if (parsedMsg.type === "error") {
            alert("Something Went Wrong: " + parsedMsg.message);
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      };

      socketRef.current = ws;
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleRunOnDevice = () => {
    const code = arduinoGen.workspaceToCode(workspaceRef.current);
    if (isConnected == true) {
      socketRef.current.send(JSON.stringify({ type: "run", code: code }));
    }
    else {
      alert("Please Start the bridge server first!");
    }
  }

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
      <button onClick={handleRunOnDevice}>Run on Device ({isConnected ? "Ready" : "Offline"})</button>
    </div>
  );
};

export default App