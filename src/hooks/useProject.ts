import { useState, useCallback, useRef } from "react";
import * as Blockly from "blockly";

// ── Types ──
export interface ProjectState {
  name: string;
  hasUnsavedChanges: boolean;
}

// ── Hook ──
// Accepts a ref to the Blockly workspace (set from App via BlocklyEditor)
// TODO: Implement Blockly serialization logic
export const useProject = () => {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const workspaceRef = useRef<any>(null);

  // Call this to give the hook access to the Blockly workspace
  const setWorkspace = useCallback((ws: any) => {
    workspaceRef.current = ws;
  }, []);

  // Mark project as changed (call from BlocklyEditor's onChange)
  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const saveToFile = useCallback(() => {
    // TODO: Use Blockly.serialization.workspaces.save(workspaceRef.current)
    // Convert to JSON string, create Blob, trigger download
    // Set hasUnsavedChanges = false on success
    const state = Blockly.serialization.workspaces.save(workspaceRef.current);
    const json = JSON.stringify({name: projectName, workspace: state}, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g,"_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  
  }, [projectName]);

  const loadFromFile = useCallback(() => {
    // TODO: Open file picker, read JSON, use
    // Blockly.serialization.workspaces.load(json, workspaceRef.current)
    // Update projectName from filename
    // Set hasUnsavedChanges = false
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if(!file)return;
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const data = JSON.parse(reader.result as string)
          if (data.workspace && workspaceRef.current){
            workspaceRef.current.clear();
            Blockly.serialization.workspaces.load(data.workspace, workspaceRef.current);
            setProjectName(data.name || file.name.replace(".json",""));
            setHasUnsavedChanges(false);
          }
        }catch(e){
          console.error("Failed to save the project: ", e)
        }
      }
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const newProject = useCallback(() => {
    workspaceRef.current?.clear();
    setProjectName("Untitled Project");
    setHasUnsavedChanges(false);
  }, []);

  return {
    projectName,
    setProjectName,
    hasUnsavedChanges,
    markChanged,
    saveToFile,
    loadFromFile,
    newProject,
    setWorkspace,
  };
};
