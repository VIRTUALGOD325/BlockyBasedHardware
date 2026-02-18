export enum ConnectionStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  UPLOADING = "UPLOADING",
  ERROR = "ERROR",
}

export interface DevicePort {
  id: string; // Keep for compatibility if used elsewhere, but path is the main identifier now
  path: string;
  manufacturer?: string;
  name: string; // Optional display name
  type: "USB" | "BLUETOOTH";
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  type: "info" | "error" | "success";
  message: string;
}

export type ThemeMode = "light" | "dark";
