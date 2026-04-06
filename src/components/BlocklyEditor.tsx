import React, { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
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
  onWorkspaceReady?: (workspace: any) => void;
  /** Fires once after init with the measured toolbox category list width (px) */
  onToolboxWidthReady?: (width: number) => void;
}

export const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  themeMode,
  onCodeChange,
  onWorkspaceReady,
  onToolboxWidthReady,
}) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const themesRef = useRef<{ dark: any; light: any } | null>(null);
  const onToolboxWidthReadyRef = useRef(onToolboxWidthReady);
  onToolboxWidthReadyRef.current = onToolboxWidthReady;

  // Delete-zone state — internal to this component
  const [isDragging, setIsDragging] = useState(false);
  const [isHoverDelete, setIsHoverDelete] = useState(false);
  // Width of the delete zone (toolbox category list width, measured once at init)
  // stored in state so the overlay always has a valid size
  const [deleteZoneWidth, setDeleteZoneWidth] = useState(0);

  // Initialize Blockly Workspace (Run Once)
  useEffect(() => {
    if (!blocklyDiv.current) return;

    // Define Themes
    const scratchTheme = Blockly.Theme.defineTheme("scratch", {
      name: "scratch",
      base: Blockly.Themes.Zelos || Blockly.Themes.Classic,
      blockStyles: {
        control_blocks: {
          colourPrimary: "#FFAB19",
          colourSecondary: "#EC9C13",
          colourTertiary: "#CF8B17",
        },
        gpio_blocks: {
          colourPrimary: "#4C97FF",
          colourSecondary: "#4280D7",
          colourTertiary: "#3373CC",
        },
        sensor_blocks: {
          colourPrimary: "#5CB1D6",
          colourSecondary: "#2E8EB8",
          colourTertiary: "#1A6E99",
        },
        actuator_blocks: {
          colourPrimary: "#9966FF",
          colourSecondary: "#7750CC",
          colourTertiary: "#5E3EA8",
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
        control_category: { colour: "#FFAB19" },
        gpio_category: { colour: "#4C97FF" },
        sensor_category: { colour: "#5CB1D6" },
        actuator_category: { colour: "#9966FF" },
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
          colourPrimary: "#FFAB19",
          colourSecondary: "#EC9C13",
          colourTertiary: "#CF8B17",
        },
        gpio_blocks: {
          colourPrimary: "#4C97FF",
          colourSecondary: "#4280D7",
          colourTertiary: "#3373CC",
        },
        sensor_blocks: {
          colourPrimary: "#5CB1D6",
          colourSecondary: "#2E8EB8",
          colourTertiary: "#1A6E99",
        },
        actuator_blocks: {
          colourPrimary: "#9966FF",
          colourSecondary: "#7750CC",
          colourTertiary: "#5E3EA8",
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
        control_category: { colour: "#FFAB19" },
        gpio_category: { colour: "#4C97FF" },
        sensor_category: { colour: "#5CB1D6" },
        actuator_category: { colour: "#9966FF" },
        math_category: { colour: "#59C059" },
        logic_category: { colour: "#59C059" },
      },
      componentStyles: {
        workspaceBackgroundColour: "#141620",
        toolboxBackgroundColour: "#11131c",
        toolboxForegroundColour: "#FFFFFF",
        flyoutBackgroundColour: "#1a1d27",
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
        spacing: 24,
        length: 2.5,
        colour: themeMode === "dark" ? "#ffffff15" : "#00000015",
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

    // Expose workspace to parent
    onWorkspaceReady?.(workspaceRef.current);

    // Pin toolbox flyout so it stays open after dragging a block out,
    // and measure the toolbox category width (stable after init)
    setTimeout(() => {
      const toolbox = workspaceRef.current?.getToolbox?.();
      const flyout = toolbox?.getFlyout?.();
      if (flyout) flyout.autoClose = false;

      // Lock the flyout workspace's scale to 1.0 so toolbox blocks never
      // resize when the canvas is zoomed. Blockly stores scale as an own
      // property on the workspace instance — we replace it with a descriptor
      // whose getter always returns 1.0 and whose setter is a no-op, so every
      // internal Blockly path (setScale, translate, reflow…) sees scale = 1.
      const flyoutWs =
        (typeof (flyout as any)?.getWorkspace === 'function'
          ? (flyout as any).getWorkspace()
          : null) ?? (flyout as any)?.workspace_;
      if (flyoutWs) {
        Object.defineProperty(flyoutWs, 'scale', {
          get: () => 1.0,
          set: (_v: number) => { /* always 1.0 */ },
          configurable: true,
        });
      }

      // Prevent wheel events over the flyout from propagating to the canvas
      // zoom handler so scrolling the block palette doesn't also zoom the canvas.
      const flyoutRoot = (flyout as any)?.svgGroup_ || flyout?.getSvgRoot?.();
      if (flyoutRoot) {
        flyoutRoot.addEventListener('wheel', (e: Event) => {
          e.stopPropagation();
        }, { passive: false });
      }

      // Measure the category list width — this is fixed after init
      const toolboxEl = blocklyDiv.current?.querySelector(".blocklyToolboxDiv");
      const measured =
        (toolboxEl as HTMLElement | null)?.offsetWidth ||
        (toolboxEl as HTMLElement | null)?.clientWidth ||
        0;
      const toolboxW = measured > 0 ? measured : 120;
      setDeleteZoneWidth(toolboxW);
      onToolboxWidthReadyRef.current?.(toolboxW);
    }, 300);

    // Track block drags to show/hide the toolbox delete-zone overlay.
    // Blockly.Events.BLOCK_DRAG may be 'drag' or 'blockDrag' depending on the
    // version. As a belt-and-suspenders fallback, also detect by the presence
    // of the isStart+blockId shape which is unique to BlockDrag events.
    const dragListener = (event: any) => {
      const isDragEvent =
        event.type === "drag" ||
        event.type === "blockDrag" ||
        (typeof event.isStart === "boolean" && event.blockId != null);
      if (!isDragEvent) return;

      if (event.isStart) {
        setIsDragging(true);
        setIsHoverDelete(false);
      } else {
        setIsDragging(false);
        setIsHoverDelete(false);
      }
    };
    workspaceRef.current.addChangeListener(dragListener);

    // Remove the flyout scrollbar entirely — use MutationObserver
    // since Blockly may create it asynchronously after inject
    const container = blocklyDiv.current;
    if (container) {
      const removeScrollbar = () => {
        container
          .querySelectorAll(".blocklyFlyoutScrollbar")
          .forEach((el) => el.remove());
      };
      removeScrollbar();
      const mo = new MutationObserver(removeScrollbar);
      mo.observe(container, { childList: true, subtree: true });
      // Stop observing after a few seconds once DOM has settled
      setTimeout(() => mo.disconnect(), 3000);
    }

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
        workspaceRef.current.removeChangeListener(dragListener);
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

  // Track pointer position during drag to highlight the toolbox delete zone.
  // Check liveness against the actual toolbox + flyout DOM elements.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const container = blocklyDiv.current;
      if (!container) return;

      const overEl = (sel: string) => {
        const el = container.querySelector(sel);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right &&
               e.clientY >= r.top  && e.clientY <= r.bottom;
      };

      setIsHoverDelete(overEl(".blocklyToolboxDiv") || overEl(".blocklyFlyout"));
    };
    // Capture phase — fires even while Blockly holds pointer capture
    window.addEventListener("pointermove", onMove, true);
    return () => window.removeEventListener("pointermove", onMove, true);
  }, [isDragging]);

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

      {/* Toolbox delete-zone overlay — appears while dragging a block.
          pointer-events:none so it never interferes with Blockly drag handling. */}
      {isDragging && (
        <div
          className={`absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-center gap-2 transition-colors duration-150 ${
            isHoverDelete
              ? "bg-red-500/20 border-r-2 border-red-400 dark:border-red-500"
              : "bg-black/[0.04] dark:bg-white/[0.04] border-r border-dashed border-gray-300/70 dark:border-white/10"
          }`}
          style={{ left: 0, width: Math.max(deleteZoneWidth, 120) }}
        >
          <div
            className={`p-2.5 rounded-full transition-all duration-150 ${
              isHoverDelete
                ? "bg-red-500 scale-110 shadow-lg shadow-red-500/30"
                : "bg-white/90 dark:bg-white/10 shadow-sm"
            }`}
          >
            <Trash2
              className={`w-5 h-5 transition-colors ${
                isHoverDelete ? "text-white" : "text-gray-400 dark:text-white/30"
              }`}
            />
          </div>
          <span
            className={`text-[11px] font-semibold transition-colors ${
              isHoverDelete
                ? "text-red-600 dark:text-red-400 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-full"
                : "text-gray-300 dark:text-white/20"
            }`}
          >
            {isHoverDelete ? "Release to delete" : "Drop to delete"}
          </span>
        </div>
      )}
    </div>
  );
};
