const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// State definitions
let activeEnvironment = null; // 'scratch' or 'hardware'
let scratchProcess = null;
let hardwareProcess = null;

// Paths to your startup scripts
const SCRATCH_SCRIPT = path.join(__dirname, '../../Scratch-Test-Main/start-dev.sh'); // Path to Scratch Platform's starter
const HARDWARE_SCRIPT = path.join(__dirname, '../start.sh'); // Uses the existing start.sh from BlockyBasedHardware (Vite + Bridge + Link)

// Utility to kill child processes safely
const killProcess = (proc, name) => {
    return new Promise((resolve) => {
        if (!proc) return resolve();
        console.log(`[Launcher] Terminating ${name} environment...`);
        // We kill the process group to ensure child processes (like webpack, vite) also die
        try {
            process.kill(-proc.pid);
        } catch (e) {
            console.log(`[Launcher] Process Group kill failed, trying graceful SIGTERM: ${e.message}`);
            proc.kill('SIGTERM');
        }

        setTimeout(() => {
            console.log(`[Launcher] ${name} environment terminated.`);
            resolve();
        }, 1500); // Give it time to close ports
    });
};

const startScratch = async () => {
    if (activeEnvironment === 'scratch') return;
    console.log('[Launcher] Switching to Scratch Environment...');

    await killProcess(hardwareProcess, 'Hardware');
    hardwareProcess = null;

    // Spawn Scratch Platform
    scratchProcess = spawn('bash', [SCRATCH_SCRIPT], { detached: true, stdio: 'ignore' });

    activeEnvironment = 'scratch';
    console.log('[Launcher] Waiting for Scratch to boot...');
    await new Promise(res => setTimeout(res, 5000)); // 5s wait for Webpack to compile
};

const startHardware = async () => {
    if (activeEnvironment === 'hardware') return;
    console.log('[Launcher] Switching to Hardware Environment...');

    await killProcess(scratchProcess, 'Scratch');
    scratchProcess = null;

    // Spawn Hardware Platform
    hardwareProcess = spawn('bash', [HARDWARE_SCRIPT], { detached: true, stdio: 'ignore' });

    activeEnvironment = 'hardware';
    console.log('[Launcher] Waiting for Hardware to boot...');
    await new Promise(res => setTimeout(res, 3000)); // 3s wait for Vite/Bridge
};

// Route: Hardware
app.get('/hardware', async (req, res) => {
    // 1. Show the Loading Screen immediately
    res.setHeader('Content-Type', 'text/html');
    res.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:sans-serif; background:#f4f4f4; flex-direction:column; }
                .loader { border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                h2 { color: #333; margin-top:20px; }
            </style>
            <!-- Auto-redirect to Frontend after 5 seconds -->
            <meta http-equiv="refresh" content="5;url=http://localhost:5173/" />
        </head>
        <body>
            <div class="loader"></div>
            <h2>Starting Hardware Backend...</h2>
            <p>Please wait while we establish connections to the Bridge and Eduprime-Link Server</p>
        </body>
        </html>
    `);

    // 2. Do the heavy lifting (booting up servers) in the background
    await startHardware();
    res.end();
});

// Route: Scratch
app.get('/scratch', async (req, res) => {
    // 1. Show the Loading Screen immediately
    res.setHeader('Content-Type', 'text/html');
    res.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { display:flex; justify-content:center; align-items:center; height:100vh; margin:0; font-family:sans-serif; background:#ffffff; flex-direction:column; }
                .loader { border: 8px solid #f3f3f3; border-top: 8px solid #ff4d4d; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                h2 { color: #333; margin-top:20px; }
            </style>
            <!-- Auto-redirect to Scratch GUI after 6 seconds -->
            <meta http-equiv="refresh" content="6;url=http://localhost:8601/" />
        </head>
        <body>
            <img src="https://scratch.mit.edu/images/logo_sm.png" alt="Scratch" style="margin-bottom: 20px;" height="50">
            <div class="loader"></div>
            <h2>Loading Scratch Platform...</h2>
        </body>
        </html>
    `);

    // 2. Boot up Webpack silently
    await startScratch();
    res.end();
});

// Root route redirects to Scratch by default
app.get('/', (req, res) => {
    res.redirect('/scratch');
});

// Clean up child processes when the Launcher is closed
process.on('SIGINT', async () => {
    console.log('\n[Launcher] Shutting down all environments...');
    await killProcess(scratchProcess, 'Scratch');
    await killProcess(hardwareProcess, 'Hardware');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🚀 Eduprime Node Launcher is active!`);
    console.log(`   Go to: http://localhost:${PORT}`);
    console.log(`===========================================\n`);

    // Automatically start Scratch when launcher is opened
    startScratch();
});
