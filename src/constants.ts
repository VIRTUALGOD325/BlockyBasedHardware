import { DevicePort } from './types';
import toolboxConfig from './toolBox';

export const MOCK_PORTS: DevicePort[] = [
  { id: 'port1', name: 'RoboBoard v2 (COM3)', type: 'USB' },
  { id: 'port2', name: 'HC-05 Bluetooth', type: 'BLUETOOTH' },
  { id: 'port3', name: 'Arduino Uno (COM4)', type: 'USB' },
];

// Blockly Toolbox Definition - using JSON format (Blockly v12+)
export const BLOCKLY_TOOLBOX = toolboxConfig;
