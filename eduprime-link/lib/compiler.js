const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class Compiler {
    constructor(cliPath) {
        this.cliPath = cliPath || 'arduino-cli';
    }

    runCommand(command) {
        return new Promise((resolve, reject) => {
            console.log(`[CMD] ${command}`);
            exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[CMD] Error: ${stderr || error.message}`);
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async ensureCoreInstalled(board = 'arduino:avr') {
        try {
            const output = await this.runCommand(`"${this.cliPath}" core list`);
            if (!output.includes(board)) {
                console.log(`[Compiler] Installing core ${board}...`);
                await this.runCommand(`"${this.cliPath}" core install ${board}`);
            }
        } catch (err) {
            throw new Error(`Failed to install core: ${err.message}`);
        }
    }

    async compile(code, fqbn = 'arduino:avr:uno') {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eduprime-sketch-'));
        const dirName = path.basename(tmpDir);
        const sketchPath = path.join(tmpDir, `${dirName}.ino`);
        fs.writeFileSync(sketchPath, code);

        await this.runCommand(`"${this.cliPath}" compile --fqbn ${fqbn} "${tmpDir}"`);
        console.log('[Compiler] Compilation successful!');
        return tmpDir;
    }

    async upload(sketchDir, port, fqbn = 'arduino:avr:uno') {
        console.log(`[Compiler] Uploading to ${port}...`);
        await this.runCommand(`"${this.cliPath}" upload -p ${port} --fqbn ${fqbn} "${sketchDir}"`);
        console.log('[Compiler] Upload successful!');
    }

    async compileAndUpload(code, port, fqbn = 'arduino:avr:uno', onStatus) {
        onStatus?.({ phase: 'core', status: 'checking' });
        await this.ensureCoreInstalled(fqbn.split(':').slice(0, 2).join(':'));

        onStatus?.({ phase: 'compile', status: 'started', message: 'Compiling...' });
        const sketchDir = await this.compile(code, fqbn);
        onStatus?.({ phase: 'compile', status: 'done', message: 'Compilation successful!' });

        try {
            onStatus?.({ phase: 'upload', status: 'started', message: `Uploading to ${port}...` });
            await this.upload(sketchDir, port, fqbn);
            onStatus?.({ phase: 'upload', status: 'done', message: 'Upload successful!' });
        } finally {
            fs.rmSync(sketchDir, { recursive: true, force: true });
        }
    }

    async compileOnly(code, fqbn = 'arduino:avr:uno') {
        await this.ensureCoreInstalled(fqbn.split(':').slice(0, 2).join(':'));
        const sketchDir = await this.compile(code, fqbn);
        fs.rmSync(sketchDir, { recursive: true, force: true });
        return { success: true, message: 'Compilation successful!' };
    }

    async checkCli() {
        try {
            const version = await this.runCommand(`"${this.cliPath}" version`);
            return { available: true, version };
        } catch {
            return { available: false, version: null };
        }
    }
}

module.exports = { Compiler };
