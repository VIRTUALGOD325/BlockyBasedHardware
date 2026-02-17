import express from 'express';
import { SerialPort } from 'serialport';
import { boardManager } from '../utils/boardManager.js';

import { handleUpload } from '../handlers/uploadHandler.js';

const router = express.Router();

// Upload Route
router.post('/upload', handleUpload);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'Up and Running',
        timestamp: Date.now()
    });
});

// List available serial devices
router.get('/devices', async (req, res) => {
    try {
        const ports = await SerialPort.list();
        const filteredPorts = ports.filter((port) => {
            return (
                port.manufacturer?.includes('Arduino') ||
                port.manufacturer?.includes('FTDI') ||
                port.manufacturer?.includes('Silicon Labs') ||
                port.path.toLowerCase().includes('usbserial') ||
                port.path.toLowerCase().includes('usbmodem')
            );
        });

        res.json({
            success: true,
            devices: filteredPorts.map((port) => ({
                path: port.path,
                manufacturer: port.manufacturer,
                vendorId: port.vendorId,
                productId: port.productId
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get server and board status
router.get('/status', (req, res) => {
    const boardInfo = boardManager.getBoardInfo();
    res.json({
        serverRunning: true,
        boardConnected: boardInfo !== null,
        boardType: boardInfo?.type || null,
        activeStreams: boardManager.getActiveStreamsCount(),
        timestamp: Date.now()
    });
});

// Connect to a specific device
router.post('/connect', async (req, res) => {
    const { port, mode } = req.body;
    if (!port) {
        return res.status(400).json({ success: false, error: "Port is required" });
    }
    try {
        await boardManager.connect(port, mode);
        res.json({ success: true, message: `Connecting to ${port}...` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Disconnect from current device
router.post('/disconnect', async (req, res) => {
    try {
        await boardManager.disconnect();
        res.json({ success: true, message: "Disconnected" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
