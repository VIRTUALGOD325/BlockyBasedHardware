import React, { useState, useEffect } from "react";
import { DevicePort } from "../types";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (port: string, mode: "WIRE" | "BT" | "BLE") => void;
  isScanning: boolean;
  devices: DevicePort[];
  scanDevices: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isScanning,
  devices,
  scanDevices,
}) => {
  const [selectedMode, setSelectedMode] = useState<"WIRE" | "BT" | "BLE">(
    "WIRE",
  );
  const [selectedPort, setSelectedPort] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      scanDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = () => {
    if (selectedPort) {
      onConnect(selectedPort, selectedMode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Connect Hardware
        </h2>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connection Mode
          </label>
          <div className="flex space-x-2">
            {(["WIRE", "BT", "BLE"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {mode === "WIRE"
                  ? "USB Wire"
                  : mode === "BT"
                    ? "Bluetooth"
                    : "BLE"}
              </button>
            ))}
          </div>
        </div>

        {/* Device List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Device
            </label>
            <button
              onClick={scanDevices}
              className="text-xs text-blue-600 hover:underline"
              disabled={isScanning}
            >
              {isScanning ? "Scanning..." : "Rescan"}
            </button>
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto">
            {devices.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No devices found. Check connection or drivers.
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.path}
                  onClick={() => setSelectedPort(device.path)}
                  className={`w-full text-left px-4 py-2 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedPort === device.path
                      ? "bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {device.path}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {device.manufacturer || "Unknown Manufacturer"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!selectedPort}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
              selectedPort
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};
