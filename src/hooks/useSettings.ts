import { useState, useCallback } from "react";

// ── Types ──
export interface HardwareSettings {
  boardType: string;
  defaultBaudRate: number;
  autoConnect: boolean;
  autoScrollConsole: boolean;
}

const DEFAULT_SETTINGS: HardwareSettings = {
  boardType: "arduino:avr:uno",
  defaultBaudRate: 9600,
  autoConnect: true,
  autoScrollConsole: true,
};

const STORAGE_KEY = "eduprime-hw-settings";

// ── Hook ──
// TODO: Implement localStorage read/write logic
export const useSettings = () => {
  const [settings, setSettings] = useState<HardwareSettings>(() => {
    // TODO: Read from localStorage and merge with defaults
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        // Ignore Corrupt Data
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = useCallback(
    <K extends keyof HardwareSettings>(key: K, value: HardwareSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
};

export const BOARD_OPTIONS = [
  { value: "arduino:avr:uno", label: "Arduino Uno" },
  { value: "arduino:avr:nano", label: "Arduino Nano" },
  { value: "arduino:avr:mega", label: "Arduino Mega" },
  { value: "esp32:esp32:esp32", label: "ESP32" },
  { value: "esp8266:esp8266:nodemcu", label: "NodeMCU (ESP8266)" },
];

export const BAUD_RATE_OPTIONS = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400,
  250000, 500000, 1000000, 2000000,
];
