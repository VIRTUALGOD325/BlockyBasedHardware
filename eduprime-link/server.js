const express = require('express');
const cors = require('cors');
const { Compiler } = require('./lib/compiler');
const { listDevices } = require('./lib/deviceScanner');
const { ensureCli } = require('./lib/setup');

const app = express();
const PORT = 8990;

let compiler = null;
let setupStatus = 'starting';
let setupMessage = 'Starting EduPrime Link...';
let cachedCliStatus = { available: false, version: null };

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname)); // Serve the dashboard UI

// ── Health Check (uses cached status, no shell exec per request) ──
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        setupStatus,
        setupMessage,
        name: 'EduPrime Link',
        version: '2.0.0',
        arduinoCli: cachedCliStatus,
        timestamp: Date.now()
    });
});

// ── List Devices ──
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await listDevices();
        res.json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Compile Only ──
app.post('/api/compile', async (req, res) => {
    if (setupStatus !== 'ready') {
        return res.status(503).json({ success: false, error: `Link is still setting up: ${setupMessage}` });
    }
    const { code, board } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, error: 'Missing code in request body.' });
    }
    try {
        const result = await compiler.compileOnly(code, board || 'arduino:avr:uno');
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Compile + Upload ──
app.post('/api/upload', async (req, res) => {
    if (setupStatus !== 'ready') {
        return res.status(503).json({ success: false, error: `Link is still setting up: ${setupMessage}` });
    }
    const { code, port, board } = req.body;
    if (!code || !port) {
        return res.status(400).json({ success: false, error: "Missing 'code' or 'port'." });
    }

    try {
        // Resolve port: Web Serial sends labels like "USB (1a86:7523)"
        // arduino-cli needs OS paths like "/dev/cu.usbserial-xxx"
        let resolvedPort = port;
        const vidPidMatch = port.match(/\(([0-9a-fA-F]+):([0-9a-fA-F]+)\)/);
        if (vidPidMatch) {
            const vid = vidPidMatch[1].toLowerCase();
            const pid = vidPidMatch[2].toLowerCase();
            console.log(`[API] Resolving VID:PID ${vid}:${pid} to system port...`);

            const devices = await listDevices();
            const match = devices.find(d =>
                d.vendorId?.toLowerCase() === vid &&
                d.productId?.toLowerCase() === pid
            );

            if (match) {
                resolvedPort = match.path;
                console.log(`[API] Resolved to: ${resolvedPort}`);
            } else {
                return res.status(400).json({
                    success: false,
                    error: `Could not find device with VID:PID ${vid}:${pid}. Is it plugged in?`
                });
            }
        }

        console.log(`[API] Upload request → ${resolvedPort}`);
        await compiler.compileAndUpload(
            code, resolvedPort, board || 'arduino:avr:uno',
            (s) => console.log(`[Upload] ${s.phase}: ${s.message || s.status}`)
        );
        res.json({ success: true, message: 'Code compiled and uploaded successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Start Server with auto-setup ──
async function startServer() {
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, '0.0.0.0', async () => {
            console.log(`🚀 EduPrime Link running on http://localhost:${PORT}`);

            // Start WebSocket server for serial communication
            try {
                require('./websocket');
                console.log('🔌 WebSocket server started on ws://localhost:8991');
            } catch (wsErr) {
                console.error('⚠️ WebSocket server failed to start:', wsErr.message);
            }

            // Auto-setup arduino-cli
            try {
                setupStatus = 'setup';
                const cliPath = await ensureCli((msg) => {
                    setupMessage = msg;
                    console.log(`[Setup] ${msg}`);
                });

                compiler = new Compiler(cliPath);
                cachedCliStatus = await compiler.checkCli();
                setupStatus = 'ready';
                setupMessage = 'Ready!';
                console.log('✅ EduPrime Link is ready!');
            } catch (err) {
                setupStatus = 'error';
                setupMessage = `Setup failed: ${err.message}`;
                console.error('❌ Setup failed:', err.message);
            }

            resolve(server);
        });
        server.on('error', reject);
    });
}

if (require.main === module) {
    startServer().catch(err => {
        console.error('Failed to start:', err.message);
        process.exit(1);
    });
}

module.exports = { startServer, app };
