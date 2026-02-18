import React, { useEffect, useRef } from "react";
// Importing from the shim defined in importmap which exports window.Blockly
import * as BlocklyFromModule from "blockly";
import { BLOCKLY_TOOLBOX } from "../constants";
// Import all custom blocks - they auto-register via defineBlocksWithJsonArray
import "../blocks";
// Import Arduino code generator and register all generator functions
import { arduinoGen } from "../../generators/arduino";
import "../../generators";

// Handle potential default export mismatch from our shim
// @ts-ignore
const Blockly = BlocklyFromModule.default || BlocklyFromModule;

interface BlocklyEditorProps {
  themeMode: "light" | "dark";
  onCodeChange: (code: string) => void;
}

export const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  themeMode,
  onCodeChange,
}) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const themesRef = useRef<{ dark: any; light: any } | null>(null);

  // Initialize Blockly Workspace (Run Once)
  useEffect(() => {
    if (!blocklyDiv.current) return;

    // Define Themes
    const scratchTheme = Blockly.Theme.defineTheme("scratch", {
      name: "scratch",
      base: Blockly.Themes.Zelos || Blockly.Themes.Classic,
      blockStyles: {
        control_blocks: {
          colourPrimary: "#4C97FF",
          colourSecondary: "#4280D7",
          colourTertiary: "#3373CC",
        },
        gpio_blocks: {
          colourPrimary: "#FF6680",
          colourSecondary: "#E64C3C",
          colourTertiary: "#CC3333",
        },
        sensor_blocks: {
          colourPrimary: "#4CBFE6",
          colourSecondary: "#2E8EB8",
          colourTertiary: "#2E8EB8",
        },
        actuator_blocks: {
          colourPrimary: "#FFAB19",
          colourSecondary: "#EC9C13",
          colourTertiary: "#CF8B17",
        },
        math_blocks: {
          colourPrimary: "#59C059",
          colourSecondary: "#46A329",
          colourTertiary: "#389438",
        },
        logic_blocks: {
          colourPrimary: "#59C059",
          colourSecondary: "#46A329",
          colourTertiary: "#389438",
        },
      },
      categoryStyles: {
        control_category: { colour: "#4C97FF" },
        gpio_category: { colour: "#FF6680" },
        sensor_category: { colour: "#4CBFE6" },
        actuator_category: { colour: "#FFAB19" },
        math_category: { colour: "#59C059" },
        logic_category: { colour: "#59C059" },
      },
      componentStyles: {
        workspaceBackgroundColour: "#F9F9F9",
        toolboxBackgroundColour: "#FFFFFF",
        toolboxForegroundColour: "#575E75",
        flyoutBackgroundColour: "#F9F9F9",
        flyoutOpacity: 1,
        scrollbarColour: "#C1C1C1",
        insertionMarkerColour: "#000000",
        markerColour: "#FF0000",
        cursorColour: "#000000",
      },
      fontStyle: {
        family: '"Helvetica Neue", Helvetica, sans-serif',
        weight: "normal",
        size: 12,
      },
    });

    const scratchDarkTheme = Blockly.Theme.defineTheme("scratch-dark", {
      name: "scratch-dark",
      base: Blockly.Themes.Zelos || Blockly.Themes.Classic,
      blockStyles: {
        control_blocks: {
          colourPrimary: "#4C97FF",
          colourSecondary: "#4280D7",
          colourTertiary: "#3373CC",
        },
        gpio_blocks: {
          colourPrimary: "#FF6680",
          colourSecondary: "#E64C3C",
          colourTertiary: "#CC3333",
        },
        sensor_blocks: {
          colourPrimary: "#4CBFE6",
          colourSecondary: "#2E8EB8",
          colourTertiary: "#2E8EB8",
        },
        actuator_blocks: {
          colourPrimary: "#FFAB19",
          colourSecondary: "#EC9C13",
          colourTertiary: "#CF8B17",
        },
        math_blocks: {
          colourPrimary: "#59C059",
          colourSecondary: "#46A329",
          colourTertiary: "#389438",
        },
        logic_blocks: {
          colourPrimary: "#59C059",
          colourSecondary: "#46A329",
          colourTertiary: "#389438",
        },
      },
      categoryStyles: {
        control_category: { colour: "#4C97FF" },
        gpio_category: { colour: "#FF6680" },
        sensor_category: { colour: "#4CBFE6" },
        actuator_category: { colour: "#FFAB19" },
        math_category: { colour: "#59C059" },
        logic_category: { colour: "#59C059" },
      },
      componentStyles: {
        workspaceBackgroundColour: "#1A1A1A",
        toolboxBackgroundColour: "#2D2D2D",
        toolboxForegroundColour: "#FFFFFF",
        flyoutBackgroundColour: "#252525",
        flyoutOpacity: 1,
        scrollbarColour: "#555555",
        insertionMarkerColour: "#FFFFFF",
        markerColour: "#FF0000",
        cursorColour: "#FFFFFF",
      },
      fontStyle: {
        family: '"Helvetica Neue", Helvetica, sans-serif',
        weight: "normal",
        size: 12,
      },
    });

    themesRef.current = { dark: scratchDarkTheme, light: scratchTheme };

    // Inject Workspace
    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
      toolbox: BLOCKLY_TOOLBOX,
      theme: themeMode === "dark" ? scratchDarkTheme : scratchTheme,
      renderer: "zelos",
      grid: {
        spacing: 20,
        length: 3,
        colour: themeMode === "dark" ? "#444444" : "#E5E5E5",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      media: "https://unpkg.com/blockly@12.3.1/media/",
    });

    // Observe container size changes and tell Blockly to resize
    const resizeObserver = new ResizeObserver(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    });
    if (blocklyDiv.current) {
      resizeObserver.observe(blocklyDiv.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle Theme Updates
  useEffect(() => {
    if (workspaceRef.current && themesRef.current) {
      const themeToUse =
        themeMode === "dark" ? themesRef.current.dark : themesRef.current.light;
      if (themeToUse) {
        workspaceRef.current.setTheme(themeToUse);
      }
    }
  }, [themeMode]);

  // Handle Code Generation & Listeners
  useEffect(() => {
    if (!workspaceRef.current) return;

    const onWorkspaceChange = () => {
      try {
        const code = arduinoGen.workspaceToCode(workspaceRef.current);
        onCodeChange(code ?? "");
      } catch (e) {
        console.error("[BlocklyEditor] Code generation error:", e);
      }
    };

    // Generate initial code
    onWorkspaceChange();

    // Attach listener
    const listenerPromise =
      workspaceRef.current.addChangeListener(onWorkspaceChange);

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.removeChangeListener(listenerPromise);
      }
    };
  }, [onCodeChange]);

  return (
    <div className="w-full h-full relative group">
      <div
        ref={blocklyDiv}
        className="absolute inset-0 z-10"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
