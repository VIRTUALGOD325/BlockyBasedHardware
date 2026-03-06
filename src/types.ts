export enum ConnectionStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTED = "CONNECTED",
  UPLOADING = "UPLOADING",
  ERROR = "ERROR",
}

export interface DevicePort {
  id: string;
  path: string;
  manufacturer?: string;
  name: string;
  type: "USB" | "BLUETOOTH";
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  type: "info" | "error" | "success";
  message: string;
}

export type ThemeMode = "light" | "dark";
