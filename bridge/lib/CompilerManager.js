import { exec } from "child_process"; // Shell Commands
import fs from "fs/promises";  // Write Files
import path from "path" // File Paths Dynamic
import os from "os"; // System Cache
import { boardManager } from "../utils/boardManager.js" // Serial Port



class CompilerManager {
    constructor() {
        this.cliPath = "arduino-cli";
        if (!this.cliPath) {
            console.error("Arduino cli missing please install");
        }
    }

    async runCommand(command) {
        return new Promise((resolve, reject) => {
            console.log(`[CMD] ${command}`); // Logs
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[CMD] Error ${stderr || error.message}`);
                    reject(new Error(stderr || error.message));
                }
                else {
                    resolve(stdout.trim());
                }
            })
        })
    }

    // Arduino Core Check 
    async ensureCoreInstalled() {
        console.log("Checking Core Arduino:avr...")
        try {
            const op = await this.runCommand(`${this.cliPath} core list`)
            if (!op.includes('arduino:avr')) {
                console.log("Installing Core");
                await this.runCommand(`${this.cliPath} core install arduino:avr`)
            }
            else {
                console.log("Core already installed.");
            }
            // Install required libraries
            await this.ensureLibrariesInstalled();
        }
        catch (err) {
            console.log(err);
            throw new Error("Failed to install core! Check Console for details.");
        }
    }

    async ensureLibrariesInstalled() {
        const libraries = [
            "IRremote@2.6.0",
            "Servo",
            "DHT sensor library",
            "Adafruit NeoPixel"
        ];
        for (const lib of libraries) {
            try {
                console.log(`Ensuring library: ${lib}`);
                await this.runCommand(`${this.cliPath} lib install "${lib}"`);
            } catch (err) {
                console.warn(`Warning: Could not install ${lib}: ${err.message}`);
            }
        }
    }

    async compile(code) {
        // Temp folder
        const tmpDir = await fs.mkdir(path.join(os.tmpdir(), "arduino-sketch-"));
        const sketchPath = path.join(tmpDir, "sketch.ino");

        // Code to file
        // TODO make logic better error handler
        await fs.writeFile(sketchPath, code);
        console.log(`Saved sketch to: ${sketchPath}`)

        // Compile Code
        await this.runCommand(`${this.cliPath} compile --fqbn arduino:avr:uno "${tmpDir}"`);

        // Uploader INPUT IMPORTANT 
        return tmpDir;
    }

    async upload(sketchDir, port) {
        console.log(`Uploading to ${port}...`);
        await this.runCommand(`${this.cliPath} upload -p ${port} --fqbn arduino:avr:uno "${sketchDir}"`);
        console.log("......Upload Success!");
    }

    async compileAndUpload(code, port) {
        // COmpile
        const sketchDir = await this.compile(code);

        // Free the PORT (CRITICAL!!)
        await boardManager.disconnect();

        // Upload
        try {
            await this.upload(sketchDir, port);
        }
        catch (e) {
            console.log("Error: ", e);
        }
        finally {
            // Clean up temp files (Storage Optimization)
            // TODO Make Robust Logic and Add Error Handling
            await fs.rm(sketchDir, { recursive: true });
        }

        // Reconnect (Serial Monitor)
        await boardManager.reconnect(port);
    }
}

export const compilerManager = new CompilerManager();

