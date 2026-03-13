const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const CLI_DIR = path.join(os.homedir(), '.eduprime', 'arduino-cli');
const CLI_BIN = os.platform() === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';
const CLI_PATH = path.join(CLI_DIR, CLI_BIN);

/**
 * Check if arduino-cli exists either globally or in our local install dir
 */
function findCli() {
    // Check local install first
    if (fs.existsSync(CLI_PATH)) {
        return CLI_PATH;
    }

    // Check global install
    try {
        const cmd = os.platform() === 'win32' ? 'where arduino-cli' : 'which arduino-cli';
        const which = execSync(cmd, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        if (which) return 'arduino-cli';
    } catch {
        // Not found globally
    }

    return null;
}

/**
 * Download and install arduino-cli to ~/.eduprime/arduino-cli/
 */
async function installCli(onProgress) {
    const version = '1.4.1';
    const platform = os.platform();
    const arch = os.arch();

    let fileName;
    if (platform === 'darwin') {
        fileName = arch === 'arm64'
            ? `arduino-cli_${version}_macOS_ARM64.tar.gz`
            : `arduino-cli_${version}_macOS_64bit.tar.gz`;
    } else if (platform === 'win32') {
        fileName = arch === 'x64'
            ? `arduino-cli_${version}_Windows_64bit.zip`
            : `arduino-cli_${version}_Windows_32bit.zip`;
    } else {
        fileName = arch === 'arm64'
            ? `arduino-cli_${version}_Linux_ARM64.tar.gz`
            : `arduino-cli_${version}_Linux_64bit.tar.gz`;
    }

    const url = `https://github.com/arduino/arduino-cli/releases/download/v${version}/${fileName}`;

    onProgress?.('Downloading Arduino tools...');
    console.log(`[Setup] Downloading arduino-cli from ${url}`);

    // Create install directory
    fs.mkdirSync(CLI_DIR, { recursive: true });

    const tarballPath = path.join(CLI_DIR, fileName);

    // Download file
    await downloadFile(url, tarballPath, onProgress);

    // Extract
    onProgress?.('Installing Arduino tools...');
    if (fileName.endsWith('.tar.gz')) {
        execSync(`tar -xzf "${tarballPath}" -C "${CLI_DIR}"`, { timeout: 30000 });
    } else {
        // For Windows zip, use PowerShell
        execSync(`powershell -Command "Expand-Archive -Path '${tarballPath}' -DestinationPath '${CLI_DIR}' -Force"`, { timeout: 30000 });
    }

    // Clean up tarball
    fs.unlinkSync(tarballPath);

    // Make executable
    if (platform !== 'win32') {
        fs.chmodSync(CLI_PATH, 0o755);
    }

    // Install Arduino AVR core
    onProgress?.('Installing Arduino board support (this may take a minute)...');
    console.log('[Setup] Installing arduino:avr core...');
    execSync(`"${CLI_PATH}" core install arduino:avr`, { timeout: 300000 });

    onProgress?.('Setup complete!');
    console.log('[Setup] arduino-cli installed successfully!');

    return CLI_PATH;
}

/**
 * Download a file following redirects
 */
function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        const follow = (url) => {
            https.get(url, { headers: { 'User-Agent': 'EduPrime-Link' } }, (res) => {
                // Follow redirects (GitHub uses 302)
                if (res.statusCode === 302 || res.statusCode === 301) {
                    return follow(res.headers.location);
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`Download failed: HTTP ${res.statusCode}`));
                    return;
                }

                const total = parseInt(res.headers['content-length'], 10) || 0;
                let downloaded = 0;
                const file = fs.createWriteStream(dest);

                res.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (total > 0) {
                        const pct = Math.round((downloaded / total) * 100);
                        onProgress?.(`Downloading Arduino tools... ${pct}%`);
                    }
                });

                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
                file.on('error', reject);
            }).on('error', reject);
        };

        follow(url);
    });
}

/**
 * Ensure arduino-cli is available, installing if needed
 * Returns the path to the cli binary
 */
async function ensureCli(onProgress) {
    let cliPath = findCli();

    if (cliPath) {
        console.log(`[Setup] arduino-cli found at: ${cliPath}`);
        return cliPath;
    }

    console.log('[Setup] arduino-cli not found, installing...');
    cliPath = await installCli(onProgress);
    return cliPath;
}

module.exports = { ensureCli, findCli, CLI_PATH };
