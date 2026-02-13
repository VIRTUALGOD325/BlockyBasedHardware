export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface DevicePort {
  id: string;
  name: string;
  type: 'USB' | 'BLUETOOTH';
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  type: 'info' | 'error' | 'success';
  message: string;
}

export type ThemeMode = 'light' | 'dark';
