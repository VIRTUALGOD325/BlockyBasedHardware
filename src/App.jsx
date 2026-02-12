import * as Blockly from "blockly";
import toolbox from './toolBox'
import './blocks'
import { arduinoGen } from '../generators/arduino'
import '../generators'
import { useState, useEffect, useRef, useCallback } from "react";
import './App.css'

/* ─── Lightweight Arduino syntax highlighter ─── */
function highlightArduino(code) {
  if (!code) return [];
  const lines = code.split('\n');
  return lines.map((line) => {
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Comments
    html = html.replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>');
    // Preprocessor directives
    html = html.replace(/(#\w+)/g, '<span class="code-preprocessor">$1</span>');
    // Strings
    html = html.replace(/(".*?")/g, '<span class="code-string">$1</span>');
    // Keywords
    html = html.replace(
      /\b(void|int|float|double|char|bool|boolean|long|unsigned|const|static|return|if|else|for|while|do|switch|case|break|continue|default|include|define|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|true|false)\b/g,
      '<span class="code-keyword">$1</span>'
    );
    // Types & functions
    html = html.replace(
      /\b(setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|delayMicroseconds|Serial|String|tone|noTone|map|constrain|millis|micros)\b/g,
      '<span class="code-function">$1</span>'
    );
    // Numbers
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>');
    // Brackets
    html = html.replace(/([{}()[\]])/g, '<span class="code-bracket">$1</span>');
    return html;
  });
}

const App = () => {
  const [generatedCode, setGeneratedCode] = useState("");
  const [showCodePanel, setShowCodePanel] = useState(false);
  const workspaceRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  /* ─── Toast system ─── */
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    setToasts(prev => [...prev, { id, message, type, icon: icons[type] || icons.info }]);
    // Auto-remove after 4s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  /* ─── Initialize Blockly ─── */
  useEffect(() => {
    const workspace = Blockly.inject('blockly-div', {
      toolbox: toolbox,
      grid: { spacing: 20, length: 3, colour: '#2a2f3e', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
      trashcan: true,
      theme: Blockly.Themes.Dark,
      renderer: 'zelos',
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
    });
    workspaceRef.current = workspace;

    return () => {
      workspace.dispose();
    };
  }, []);

  /* ─── WebSocket connection ─── */
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket("ws://localhost:8765");
      ws.onopen = () => {
        setIsConnected(true);
        addToast("Bridge server connected", "success");
      };

      ws.onmessage = (event) => {
        try {
          const parsedMsg = JSON.parse(event.data);
          if (parsedMsg.type === "connected") {
            addToast("Arduino board detected!", "success");
          } else if (parsedMsg.type === "error") {
            addToast(parsedMsg.message || "Something went wrong", "error");
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      socketRef.current = ws;
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [addToast]);

  /* ─── Actions ─── */
  const handleGenerateCode = useCallback(() => {
    if (!workspaceRef.current) return;
    const code = arduinoGen.workspaceToCode(workspaceRef.current);
    setGeneratedCode(code);
    setShowCodePanel(true);
    addToast("Code generated successfully", "success");
  }, [addToast]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      addToast("Code copied to clipboard", "success");
    }).catch(() => {
      addToast("Failed to copy code", "error");
    });
  }, [generatedCode, addToast]);

  const handleRunOnDevice = useCallback(() => {
    if (!workspaceRef.current) return;
    const code = arduinoGen.workspaceToCode(workspaceRef.current);
    if (isConnected && socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: "run", code: code }));
      addToast("Code sent to device", "info");
    } else {
      addToast("Bridge server is offline. Start it first!", "error");
    }
  }, [isConnected, addToast]);

  const handleCloseCodePanel = useCallback(() => {
    setShowCodePanel(false);
  }, []);

  const handleUndo = useCallback(() => {
    if (workspaceRef.current) workspaceRef.current.undo(false);
  }, []);

  const handleRedo = useCallback(() => {
    if (workspaceRef.current) workspaceRef.current.undo(true);
  }, []);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e) => {
      // Ctrl/Cmd + G → Generate Code
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        handleGenerateCode();
      }
      // Ctrl/Cmd + Shift + R → Run on Device
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleRunOnDevice();
      }
      // Escape → Close code panel
      if (e.key === 'Escape' && showCodePanel) {
        handleCloseCodePanel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerateCode, handleRunOnDevice, showCodePanel, handleCloseCodePanel]);

  /* ─── Syntax-highlighted lines ─── */
  const highlightedLines = highlightArduino(generatedCode);

  return (
    <div className="app-container">
      {/* ═══ HEADER ═══ */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            <div className="logo-text">
              Blockly<span>HW</span>
            </div>
          </div>

          <div className="board-selector" title="Board selection (coming soon)">
            <span className="board-selector-icon">⬡</span>
            <span>Arduino Uno</span>
            <span className="board-selector-chevron">▾</span>
          </div>
        </div>

        <div className="header-center">
          <button className="btn btn-ghost" onClick={handleUndo} title="Undo (Ctrl+Z)">
            <span className="btn-icon">↩</span>
          </button>
          <button className="btn btn-ghost" onClick={handleRedo} title="Redo (Ctrl+Shift+Z)">
            <span className="btn-icon">↪</span>
          </button>

          <div className="toolbar-divider" />

          <button className="btn btn-primary" onClick={handleGenerateCode} title="Generate Code (Ctrl+G)">
            <span className="btn-icon">{ }</span>
            <span>Generate</span>
          </button>

          <button className="btn btn-run" onClick={handleRunOnDevice} title="Run on Device (Ctrl+Shift+R)">
            <span className="btn-icon">▶</span>
            <span>Upload</span>
          </button>
        </div>

        <div className="header-right">
          <div className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span>{isConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* ═══ BLOCKLY WORKSPACE ═══ */}
      <div className="workspace-area">
        <div id="blockly-div" />
      </div>

      {/* ═══ CODE PANEL OVERLAY ═══ */}
      <div
        className={`code-panel-overlay ${showCodePanel ? 'visible' : ''}`}
        onClick={handleCloseCodePanel}
      />

      {/* ═══ CODE PANEL ═══ */}
      <div className={`code-panel ${showCodePanel ? 'open' : ''}`}>
        <div className="code-panel-header">
          <div className="code-panel-title">
            <span className="code-panel-title-dot" />
            Arduino C++
          </div>
          <div className="code-panel-actions">
            <button className="btn btn-secondary" onClick={handleCopyCode} title="Copy code">
              <span className="btn-icon">📋</span>
              <span>Copy</span>
            </button>
            <button className="btn btn-ghost" onClick={handleCloseCodePanel} title="Close panel (Esc)">
              <span className="btn-icon">✕</span>
            </button>
          </div>
        </div>
        <div className="code-panel-body">
          <pre>
            {highlightedLines.map((lineHtml, i) => (
              <div className="code-line" key={i}>
                <span className="code-line-number">{i + 1}</span>
                <span className="code-line-content" dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }} />
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <footer className="status-bar">
        <div className="status-bar-left">
          <div className="status-item">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span>Bridge: {isConnected ? 'Connected' : 'Offline'}</span>
          </div>
          <div className="status-item">
            <span>⬡</span>
            <span>Arduino Uno</span>
          </div>
        </div>
        <div className="status-bar-right">
          <div className="status-item">
            <span>⌘G Generate</span>
          </div>
          <div className="status-item">
            <span>⌘⇧R Upload</span>
          </div>
        </div>
      </footer>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}
          >
            <span className="toast-icon">{toast.icon}</span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App