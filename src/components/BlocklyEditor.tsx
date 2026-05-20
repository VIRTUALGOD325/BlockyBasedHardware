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

interface CustomBlockConfig {
  name: string;
  label: string;
  category: string;
  color: string;
  blockJson: object | null;
  codeTemplate: string;
  includesCode?: string;
  setupCode?: string;
  variablesCode?: string;
}

interface BlockConfig {
  builtinEnabled: string[] | "all";
  custom: CustomBlockConfig[];
}

function filterToolbox(base: any, config: BlockConfig): any {
  const enabledSet = config.builtinEnabled === "all" ? null : new Set(config.builtinEnabled as string[]);
  const filtered = {
    ...base,
    contents: base.contents
      .map((cat: any) => {
        if (cat.custom) return cat;
        return {
          ...cat,
          contents: enabledSet
            ? (cat.contents || []).filter((b: any) => enabledSet.has(b.type))
            : cat.contents,
        };
      })
      .filter((cat: any) => cat.custom || (cat.contents && cat.contents.length > 0)),
  };
  // Inject enabled custom blocks into their category (or a new one)
  for (const block of config.custom) {
    const existing = filtered.contents.find((c: any) => c.name === block.category);
    if (existing && existing.contents) {
      existing.contents.push({ kind: "block", type: block.name });
    } else {
      // Insert before Variables
      const varIdx = filtered.contents.findIndex((c: any) => c.custom === "VARIABLE");
      const insertAt = varIdx >= 0 ? varIdx : filtered.contents.length - 2;
      filtered.contents.splice(insertAt, 0, {
        kind: "category",
        name: block.category,
        colour: block.color,
        contents: [{ kind: "block", type: block.name }],
      });
    }
  }
  return filtered;
}

function registerCustomBlock(Blockly: any, block: CustomBlockConfig): void {
  if (block.blockJson) {
    Blockly.common.defineBlocksWithJsonArray([block.blockJson]);
  }
  arduinoGen.forBlock[block.name] = function (b: any) {
    let code = block.codeTemplate || "";
    // Extract all field values and substitute into template
    b.inputList?.forEach((input: any) => {
      input.fieldRow?.forEach((field: any) => {
        if (field.name) {
          const val = b.getFieldValue(field.name) ?? "";
          code = code.split(`{${field.name}}`).join(val);
        }
      });
    });
    if (block.includesCode) arduinoGen.includes_[block.name + "_inc"] = block.includesCode;
    if (block.variablesCode) arduinoGen.variables_[block.name + "_var"] = block.variablesCode;
    if (block.setupCode) arduinoGen.setupCode_[block.name + "_setup"] = block.setupCode;
    return code + "\n";
  };
}

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
  const flyoutRef = useRef<any>(null);
  const onToolboxWidthReadyRef = useRef(onToolboxWidthReady);
  onToolboxWidthReadyRef.current = onToolboxWidthReady;

  // Delete-zone state — internal to this component
  const [isDragging, setIsDragging] = useState(false);
  const [isHoverDelete, setIsHoverDelete] = useState(false);
  // Width of the delete zone (toolbox category list width, measured once at init)
  // stored in state so the overlay always has a valid size
  const [deleteZoneWidth, setDeleteZoneWidth] = useState(0);

  // Make a Block modal state
  const [makeBlockModal, setMakeBlockModal] = useState(false);
  const [makeBlockName, setMakeBlockName] = useState('');
  const makeBlockWsRef = useRef<any>(null);
  // Stable ref so the button callback (registered once) always sees current setter
  const openMakeBlockRef = useRef(() => {});

  // Block registry config (fetched from scratch-backend)
  const [blockConfig, setBlockConfig] = useState<BlockConfig | null>(null);

  // Fetch block config from scratch-backend
  useEffect(() => {
    const base = (import.meta as any).env?.VITE_SCRATCH_API_URL ?? "/api/scratch/api";
    fetch(`${base}/blocks`)
      .then(r => r.json())
      .then((data: BlockConfig) => setBlockConfig(data))
      .catch(() => setBlockConfig({ builtinEnabled: "all", custom: [] }));
  }, []);

  // Apply block config: register custom blocks + update toolbox
  useEffect(() => {
    if (!blockConfig || !workspaceRef.current) return;
    // Register any custom block definitions + generators
    for (const block of blockConfig.custom) {
      registerCustomBlock(Blockly, block);
    }
    const newToolbox = filterToolbox(BLOCKLY_TOOLBOX, blockConfig);
    try { workspaceRef.current.updateToolbox(newToolbox); } catch {}
  }, [blockConfig]);

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
        flyoutBackgroundColour: "#e8edf8",
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
        flyoutBackgroundColour: "#1c2235",
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

    // Scratch-style PROCEDURE flyout: "Make a Block" button + existing call blocks
    workspaceRef.current.registerToolboxCategoryCallback('PROCEDURE', (ws: any) => {
      const items: any[] = [
        { kind: 'button', text: 'Make a Block', callbackKey: 'CREATE_PROCEDURE' },
      ];
      try {
        const [noReturn, withReturn] = Blockly.Procedures.allProcedures(ws);
        for (const [name, params] of noReturn) {
          items.push({ kind: 'block', type: 'procedures_callnoreturn', gap: 16, extraState: { name, params } });
        }
        for (const [name, params] of withReturn) {
          items.push({ kind: 'block', type: 'procedures_callreturn', gap: 16, extraState: { name, params } });
        }
      } catch {}
      return items;
    });

    // "Make a Block" button opens the React modal
    workspaceRef.current.registerButtonCallback('CREATE_PROCEDURE', (btn: any) => {
      makeBlockWsRef.current = btn.getTargetWorkspace();
      openMakeBlockRef.current();
    });

    // Expose workspace to parent
    onWorkspaceReady?.(workspaceRef.current);

    // Pin toolbox flyout so it stays open after dragging a block out,
    // and measure the toolbox category width (stable after init)
    setTimeout(() => {
      const toolbox = workspaceRef.current?.getToolbox?.();
      const flyout = toolbox?.getFlyout?.();
      if (flyout) flyout.autoClose = false;
      flyoutRef.current = flyout ?? null;

      // Lock the flyout workspace's scale to 0.75 so toolbox blocks are
      // smaller and more compact. Blockly stores scale as an own property
      // on the workspace instance — we replace it with a descriptor whose
      // getter always returns 0.75 and whose setter is a no-op, so every
      // internal Blockly path (setScale, translate, reflow…) sees scale = 0.75.
      const FLYOUT_SCALE = 0.65;
      const flyoutWs =
        (typeof (flyout as any)?.getWorkspace === 'function'
          ? (flyout as any).getWorkspace()
          : null) ?? (flyout as any)?.workspace_;
      if (flyoutWs) {
        Object.defineProperty(flyoutWs, 'scale', {
          get: () => FLYOUT_SCALE,
          set: (_v: number) => { /* always FLYOUT_SCALE */ },
          configurable: true,
        });
      }

      // Lock the flyout to a fixed width so it never resizes based on content.
      const FLYOUT_WIDTH = 250;
      if (flyout) {
        // Override getWidth so Blockly always sees our fixed flyout width
        (flyout as any).getWidth = () => FLYOUT_WIDTH;

        // Prevent setWidth from changing the width
        if (typeof (flyout as any).setWidth === 'function') {
          (flyout as any).setWidth = (_w: number) => { /* no-op */ };
        }

        // Override the width_ property so Blockly's internal reflow
        // always reads our fixed value
        Object.defineProperty(flyout, 'width_', {
          get: () => FLYOUT_WIDTH,
          set: (_v: number) => { /* always fixed */ },
          configurable: true,
        });

        // Wrap reflow so the flyout never auto-resizes
        const origReflow = (flyout as any).reflow?.bind(flyout);
        if (origReflow) {
          (flyout as any).reflow = () => {
            origReflow();
            // Re-enforce the width on the SVG element after Blockly reflows
            const flyoutSvg = (flyout as any).svgGroup_?.querySelector?.('rect.blocklyFlyoutBackground') ||
              (flyout as any).svgBackground_;
            if (flyoutSvg) {
              flyoutSvg.setAttribute('width', String(FLYOUT_WIDTH));
            }
          };
        }

        // Wrap position to re-enforce after every Blockly layout pass
        const origFlyoutPos = (flyout as any).position?.bind(flyout);
        if (origFlyoutPos) {
          (flyout as any).position = () => {
            origFlyoutPos();
            const flyoutSvg = (flyout as any).svgGroup_?.querySelector?.('rect.blocklyFlyoutBackground') ||
              (flyout as any).svgBackground_;
            if (flyoutSvg) {
              flyoutSvg.setAttribute('width', String(FLYOUT_WIDTH));
            }
          };
        }
      }

      // Prevent wheel events over the flyout from propagating to the canvas
      // zoom handler so scrolling the block palette doesn't also zoom the canvas.
      const flyoutRoot = (flyout as any)?.svgGroup_ || flyout?.getSvgRoot?.();
      if (flyoutRoot) {
        flyoutRoot.addEventListener('wheel', (e: Event) => {
          e.stopPropagation();
        }, { passive: false });
      }

      // Force toolbox category list to a fixed narrow width.
      // Blockly internally uses toolbox.getWidth() for all layout
      // calculations and calls toolbox.position() on resize/reflow,
      // so CSS alone cannot control this. We monkey-patch getWidth()
      // to always return our desired width, and wrap position() to
      // re-enforce the DOM element width after every Blockly reflow.
      const TOOLBOX_WIDTH = 120;
      if (toolbox) {
        // Override getWidth so Blockly always sees our fixed width
        (toolbox as any).getWidth = () => TOOLBOX_WIDTH;

        // Wrap position() to re-apply DOM width after Blockly reflows
        const origPosition = (toolbox as any).position?.bind(toolbox);
        if (origPosition) {
          (toolbox as any).position = () => {
            origPosition();
            const el = (toolbox as any).HtmlDiv || (toolbox as any).htmlDiv_ ||
              blocklyDiv.current?.querySelector(".blocklyToolboxDiv");
            if (el) {
              el.style.setProperty('width', `${TOOLBOX_WIDTH}px`, 'important');
            }
          };
        }

        // Apply immediately
        const toolboxEl = (toolbox as any).HtmlDiv || (toolbox as any).htmlDiv_ ||
          blocklyDiv.current?.querySelector(".blocklyToolboxDiv");
        if (toolboxEl) {
          toolboxEl.style.setProperty('width', `${TOOLBOX_WIDTH}px`, 'important');
        }
      }
      setDeleteZoneWidth(TOOLBOX_WIDTH);
      onToolboxWidthReadyRef.current?.(TOOLBOX_WIDTH);

      // ── Hover-to-reveal: expand flyout SVG viewport + background on hover ──
      // The flyout SVG element clips content to its viewport width by default.
      // We expand both the SVG element width and the background rect on hover
      // so wide blocks are fully visible. CSS overflow:visible on .blocklyFlyout
      // handles the actual clip; expanding the SVG width makes the background
      // and interactive region follow.
      //
      // IMPORTANT: We override flyout.getClientRect() to always return the
      // *logical* (non-expanded) rect. Blockly uses getClientRect() to decide
      // whether a dropped block should be deleted (i.e. "was it dropped on the
      // flyout?"). Without this override the expanded 560px SVG width causes
      // Blockly to treat mid-canvas drops as flyout drops and delete blocks.
      //
      // We return a plain object that matches Blockly's Rect interface
      // (top/bottom/left/right + containsPoint({x,y})). Using a bare DOMRect
      // would break drags because Blockly calls rect.containsPoint() which
      // DOMRect does not expose, throwing during drag and leaving blocks stuck.
      if (flyout && typeof (flyout as any).getClientRect === 'function') {
        (flyout as any).getClientRect = () => {
          const toolboxEl =
            (toolbox as any).HtmlDiv ??
            (toolbox as any).htmlDiv_ ??
            blocklyDiv.current?.querySelector('.blocklyToolboxDiv');
          const tbRect = toolboxEl?.getBoundingClientRect?.() ??
            { left: 0, right: TOOLBOX_WIDTH, top: 0, bottom: window.innerHeight };
          const l = tbRect.right;
          const r = tbRect.right + FLYOUT_WIDTH;
          const t = tbRect.top;
          const b = tbRect.bottom;
          return {
            left: l, right: r, top: t, bottom: b,
            // Blockly 12 calls clientRect.contains(clientX, clientY) during drag
            contains: (x: number, y: number) =>
              x >= l && x <= r && y >= t && y <= b,
          };
        };
      }

      if (flyoutRoot) {
        const EXPANDED_WIDTH = 560;
        const flyoutSvg = flyoutRoot.closest('svg') as SVGSVGElement | null;

        const getBgRect = (): SVGRectElement | null =>
          flyoutRoot.querySelector('rect.blocklyFlyoutBackground');

        const expand = () => {
          if (flyoutSvg) flyoutSvg.setAttribute('width', String(EXPANDED_WIDTH));
          const bg = getBgRect();
          if (bg) bg.setAttribute('width', String(EXPANDED_WIDTH));
        };

        const collapse = () => {
          if (flyoutSvg) flyoutSvg.setAttribute('width', String(FLYOUT_WIDTH));
          const bg = getBgRect();
          if (bg) bg.setAttribute('width', String(FLYOUT_WIDTH));
        };

        flyoutRoot.addEventListener('mouseenter', expand);
        flyoutRoot.addEventListener('mouseleave', collapse);
      }
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
    // since Blockly may create it asynchronously after inject.
    // Also continuously enforce the toolbox width — Blockly resets
    // inline styles on resize / reflow events.
    const container = blocklyDiv.current;
    if (container) {
      const TOOLBOX_W = 120;
      const enforce = () => {
        container
          .querySelectorAll(".blocklyFlyoutScrollbar")
          .forEach((el) => el.remove());
        const tbEl = container.querySelector(".blocklyToolboxDiv") as HTMLElement | null;
        if (tbEl && tbEl.style.width !== `${TOOLBOX_W}px`) {
          tbEl.style.setProperty('width', `${TOOLBOX_W}px`, 'important');
          tbEl.style.setProperty('max-width', `${TOOLBOX_W}px`, 'important');
          tbEl.style.setProperty('min-width', `${TOOLBOX_W}px`, 'important');
          const isDark = document.documentElement.classList.contains('dark');
          tbEl.style.setProperty('border-right', `1px solid ${isDark ? '#4b5563' : '#9ca3af'}`, 'important');
        }
        // Note: flyout background width is managed by hover-to-reveal handlers
        // and CSS !important — not enforced here to avoid fighting the expansion.
      };
      enforce();
      const mo = new MutationObserver(enforce);
      mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
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
  // Use flyout.getClientRect() (which we override to the logical fixed width)
  // so the hover check matches exactly what Blockly uses for deletion detection.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const container = blocklyDiv.current;
      if (!container) return;

      // Toolbox category list — use DOM bounds (it never visually expands)
      const toolboxEl = container.querySelector('.blocklyToolboxDiv');
      let overToolbox = false;
      if (toolboxEl) {
        const r = toolboxEl.getBoundingClientRect();
        overToolbox = e.clientX >= r.left && e.clientX <= r.right &&
                      e.clientY >= r.top  && e.clientY <= r.bottom;
      }

      // Flyout — use Blockly's getClientRect() so the boundary matches
      // exactly what Blockly uses when deciding whether to delete a block.
      let overFlyout = false;
      const flyout = flyoutRef.current;
      if (flyout && typeof flyout.getClientRect === 'function') {
        try {
          const r = flyout.getClientRect();
          overFlyout = e.clientX >= r.left && e.clientX <= r.right &&
                       e.clientY >= r.top  && e.clientY <= r.bottom;
        } catch (_) { /* ignore */ }
      }

      setIsHoverDelete(overToolbox || overFlyout);
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

  // Keep the ref current so the button callback (registered once) always triggers latest setter
  openMakeBlockRef.current = () => { setMakeBlockName(''); setMakeBlockModal(true); };

  const confirmMakeBlock = () => {
    const ws = makeBlockWsRef.current || workspaceRef.current;
    if (!ws) return;
    const name = makeBlockName.trim() || 'do something';
    const block = ws.newBlock('procedures_defnoreturn');
    block.setFieldValue(name, 'NAME');
    block.initSvg();
    block.render();
    // Place near top-left of current view
    try {
      const metrics = ws.getMetrics?.();
      if (metrics) {
        block.moveBy(
          (metrics.viewLeft + 40) / (ws.scale || 1),
          (metrics.viewTop + 40) / (ws.scale || 1),
        );
      }
    } catch {}
    setMakeBlockModal(false);
    // Refresh the My Blocks flyout so the new call block appears immediately
    try {
      const toolbox = workspaceRef.current?.getToolbox?.();
      if (toolbox) {
        if (typeof (toolbox as any).refreshSelection === 'function') {
          (toolbox as any).refreshSelection();
        } else if (typeof (toolbox as any).render === 'function') {
          (toolbox as any).render((toolbox as any).toolboxDef_);
        }
      }
    } catch {}
  };

  return (
    <div className="w-full h-full relative group">
      <div
        ref={blocklyDiv}
        className="absolute inset-0 z-10"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Toolbox delete-zone overlay — only visible when dragging over the toolbox area. */}
      {isDragging && isHoverDelete && (
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-center gap-2 bg-red-500/20 border-r-2 border-red-400 dark:border-red-500 transition-colors duration-150"
          style={{ left: 0, width: Math.max(deleteZoneWidth, 120) }}
        >
          <div className="p-2.5 rounded-full bg-red-500 scale-110 shadow-lg shadow-red-500/30">
            <Trash2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-white/80 dark:bg-black/40 px-2 py-0.5 rounded-full">
            Release to delete
          </span>
        </div>
      )}

      {/* Make a Block modal */}
      {makeBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/10">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white">Make a Block</h2>
              <p className="text-xs text-white/40 mt-0.5">Define a reusable custom block</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Block name</label>
                <input
                  autoFocus
                  type="text"
                  value={makeBlockName}
                  onChange={e => setMakeBlockName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmMakeBlock(); if (e.key === 'Escape') setMakeBlockModal(false); }}
                  placeholder="e.g. blink LED"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">
                After creating, click the <span className="text-white/50">⚙ gear</span> icon on the block to add inputs and parameters.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setMakeBlockModal(false)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white/80 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMakeBlock}
                className="px-4 py-2 text-sm font-medium bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
