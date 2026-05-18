import { useState, useCallback, useRef } from "react";
import * as Blockly from "blockly";

export interface ProjectState {
  name: string;
  hasUnsavedChanges: boolean;
}

export interface CloudProject {
  id: number;
  title: string;
  platform: string;
  created_at: string;
  updated_at: string | null;
}

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5050/api"
    : "/api/scratch/api";

export const useProject = () => {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cloudProjectId, setCloudProjectId] = useState<number | null>(null);
  const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
  const [cloudProjectsLoading, setCloudProjectsLoading] = useState(false);
  const workspaceRef = useRef<any>(null);

  const setWorkspace = useCallback((ws: any) => {
    workspaceRef.current = ws;
  }, []);

  const markChanged = useCallback(() => setHasUnsavedChanges(true), []);

  const saveToFile = useCallback(() => {
    const state = Blockly.serialization.workspaces.save(workspaceRef.current);
    const json = JSON.stringify({ name: projectName, workspace: state }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  }, [projectName]);

  const loadFromFile = useCallback((onAfterLoad?: () => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.workspace && workspaceRef.current) {
            workspaceRef.current.clear();
            Blockly.serialization.workspaces.load(data.workspace, workspaceRef.current);
            setProjectName(data.name || file.name.replace(".json", ""));
            setCloudProjectId(null);
            setHasUnsavedChanges(false);
            onAfterLoad?.();
          }
        } catch (e) {
          console.error("Failed to load the project: ", e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const newProject = useCallback(() => {
    workspaceRef.current?.clear();
    setProjectName("Untitled Project");
    setCloudProjectId(null);
    setHasUnsavedChanges(false);
  }, []);

  const undo = useCallback(() => workspaceRef.current?.undo(false), []);
  const redo = useCallback(() => workspaceRef.current?.undo(true), []);

  // ── Cloud save ──

  const saveToServer = useCallback(async (accessToken: string): Promise<void> => {
    const state = Blockly.serialization.workspaces.save(workspaceRef.current);
    const body = JSON.stringify({ workspace: state });
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

    let url: string;
    let method: string;
    if (cloudProjectId) {
      url = `${API_BASE}/projects/${cloudProjectId}?title=${encodeURIComponent(projectName)}`;
      method = "PUT";
    } else {
      url = `${API_BASE}/projects?title=${encodeURIComponent(projectName)}&platform=hardware`;
      method = "POST";
    }

    const res = await fetch(url, { method, headers, body });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || "Save failed");
      err.code = data.error;
      throw err;
    }
    if (!cloudProjectId) setCloudProjectId(data.id);
    setHasUnsavedChanges(false);
  }, [cloudProjectId, projectName]);

  const loadProjectsList = useCallback(async (accessToken: string): Promise<CloudProject[]> => {
    setCloudProjectsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to load projects");
      const hwProjects = (data.projects as CloudProject[]).filter(p => p.platform === "hardware");
      setCloudProjects(hwProjects);
      return hwProjects;
    } finally {
      setCloudProjectsLoading(false);
    }
  }, []);

  const loadProjectById = useCallback(async (id: number, accessToken: string, onAfterLoad?: () => void): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Failed to load project");
    const projectData = JSON.parse(data.project.project_json);
    if (projectData.workspace && workspaceRef.current) {
      workspaceRef.current.clear();
      Blockly.serialization.workspaces.load(projectData.workspace, workspaceRef.current);
      setProjectName(data.project.title);
      setCloudProjectId(id);
      setHasUnsavedChanges(false);
      onAfterLoad?.();
    }
  }, []);

  const deleteServerProject = useCallback(async (id: number, accessToken: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to delete project");
    if (cloudProjectId === id) setCloudProjectId(null);
    setCloudProjects(prev => prev.filter(p => p.id !== id));
  }, [cloudProjectId]);

  return {
    projectName,
    setProjectName,
    hasUnsavedChanges,
    markChanged,
    saveToFile,
    loadFromFile,
    newProject,
    setWorkspace,
    undo,
    redo,
    cloudProjectId,
    cloudProjects,
    cloudProjectsLoading,
    saveToServer,
    loadProjectsList,
    loadProjectById,
    deleteServerProject,
  };
};
