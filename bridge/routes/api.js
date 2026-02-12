import express from 'express';
import { SerialPort } from 'serialport';
import { boardManager } from '../utils/boardManager.js';

const router = express.Router();

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
                port.manufacturer?.includes('Silicon Labs')
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

export default router;
