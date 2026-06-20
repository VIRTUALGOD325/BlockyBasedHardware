import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3100;
const ADMIN_KEY = process.env.COMPILE_SERVER_ADMIN_KEY || "";

// Persistent build dir so arduino-cli's incremental compile cache survives between
// requests. The first compile on a cold server is still 5–15s; subsequent compiles
// of the same or similar sketches drop to ~1–2s because object files are reused.
const BUILD_ROOT = path.join(os.tmpdir(), "kyna-compile-cache");
await fs.mkdir(BUILD_ROOT, { recursive: true });

// In-memory hex cache keyed by sha256(code + fqbn). Students hit Upload repeatedly
// with identical code; this turns those into near-instant responses.
const HEX_CACHE = new Map();
const HEX_CACHE_MAX = 200;
function cacheKey(code, fqbn) {
  return crypto.createHash("sha256").update(`${fqbn}\0${code}`).digest("hex");
}
function cacheGet(key) {
  const entry = HEX_CACHE.get(key);
  if (!entry) return null;
  // LRU-ish: re-insert to mark recently used
  HEX_CACHE.delete(key);
  HEX_CACHE.set(key, entry);
  return entry;
}
function cacheSet(key, hex) {
  HEX_CACHE.set(key, hex);
  if (HEX_CACHE.size > HEX_CACHE_MAX) {
    const oldest = HEX_CACHE.keys().next().value;
    HEX_CACHE.delete(oldest);
  }
}

// Allow all origins (the frontend is on Vercel, Link is on localhost)
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// ── Admin key guard ──

function adminGuard(req, res, next) {
  if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  next();
}

// ── Arduino CLI wrapper ──

const CLI = process.env.ARDUINO_CLI_PATH || "arduino-cli";
let coreReady = false;

function run(command) {
  return new Promise((resolve, reject) => {
    console.log(`[CMD] ${command}`);
    exec(command, { timeout: 120_000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[CMD] Error: ${stderr || error.message}`);
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function ensureCore() {
  if (coreReady) return;
  console.log("[Setup] Checking arduino:avr core...");
  const list = await run(`${CLI} core list`);
  if (!list.includes("arduino:avr")) {
    console.log("[Setup] Installing arduino:avr core...");
    await run(`${CLI} core install arduino:avr`);
  }
  // Install common libraries
  const libs = ["IRremote@2.6.0", "Servo", "DHT sensor library", "Adafruit NeoPixel"];
  for (const lib of libs) {
    try {
      await run(`${CLI} lib install "${lib}"`);
    } catch {
      console.warn(`[Setup] Could not install ${lib}`);
    }
  }
  coreReady = true;
  console.log("[Setup] Core and libraries ready!");
}

// ── Routes ──

app.get("/health", (_req, res) => {
  res.json({ status: "ok", coreReady, timestamp: Date.now() });
});

// Compile-only (verify code compiles)
app.post("/api/compile", async (req, res) => {
  const { code, board } = req.body;
  if (!code) return res.status(400).json({ success: false, error: "Missing code" });

  try {
    await ensureCore();
    const fqbn = board || "arduino:avr:uno";
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "eduprime-"));
    const sketchDir = path.join(tmpDir, "sketch");
    await fs.mkdir(sketchDir);
    const sketchPath = path.join(sketchDir, "sketch.ino");
    await fs.writeFile(sketchPath, code);

    try {
      await run(`${CLI} compile --fqbn ${fqbn} "${sketchDir}"`);
      res.json({ success: true, message: "Compilation successful!" });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Compile and return hex binary (for browser WebSerial flashing)
app.post("/api/compile-hex", async (req, res) => {
  const { code, board } = req.body;
  if (!code) return res.status(400).json({ success: false, error: "Missing code" });

  const fqbn = board || "arduino:avr:uno";
  const key = cacheKey(code, fqbn);

  // Fast path: identical sketch already compiled → return cached hex.
  const cached = cacheGet(key);
  if (cached) {
    console.log(`[Cache] HIT ${key.slice(0, 8)} (${cached.length} bytes)`);
    return res.json({ success: true, hex: cached, cached: true, message: "Compilation successful (cached)!" });
  }

  try {
    await ensureCore();

    // Use a per-key sketch dir under BUILD_ROOT so arduino-cli's incremental
    // build cache is reused across requests with the same code (or even small
    // edits — arduino-cli only rebuilds changed translation units).
    const sketchDir = path.join(BUILD_ROOT, key, "sketch");
    const buildDir = path.join(BUILD_ROOT, key, "build");
    await fs.mkdir(sketchDir, { recursive: true });
    const sketchPath = path.join(sketchDir, "sketch.ino");
    await fs.writeFile(sketchPath, code);

    await run(`${CLI} compile --fqbn ${fqbn} --output-dir "${buildDir}" "${sketchDir}"`);

    // Find the compiled hex file
    let hex;
    try {
      hex = await fs.readFile(path.join(buildDir, "sketch.ino.hex"), "utf-8");
    } catch {
      const files = await fs.readdir(buildDir);
      const hexFile = files.find((f) => f.endsWith(".hex"));
      if (!hexFile) throw new Error("Compiled hex file not found");
      hex = await fs.readFile(path.join(buildDir, hexFile), "utf-8");
    }

    cacheSet(key, hex);
    console.log(`[Cache] MISS ${key.slice(0, 8)} stored (${hex.length} bytes)`);
    res.json({ success: true, hex, cached: false, message: "Compilation successful!" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Admin library management ──

// Install a library by name from the Arduino Library Manager
app.post("/admin/install-lib", adminGuard, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "Missing name" });
  try {
    await ensureCore();
    const output = await run(`${CLI} lib install "${name}"`);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Install a library from a base64-encoded zip
app.post("/admin/install-lib-zip", adminGuard, async (req, res) => {
  const { name, zipBase64 } = req.body;
  if (!zipBase64) return res.status(400).json({ success: false, error: "Missing zipBase64" });
  let tmpFile;
  try {
    await ensureCore();
    const buf = Buffer.from(zipBase64, "base64");
    tmpFile = path.join(os.tmpdir(), `kyna-lib-${Date.now()}.zip`);
    await fs.writeFile(tmpFile, buf);
    const output = await run(`${CLI} lib install --zip-path "${tmpFile}"`);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  } finally {
    if (tmpFile) await fs.unlink(tmpFile).catch(() => {});
  }
});

// Uninstall a library by name
app.delete("/admin/uninstall-lib", adminGuard, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "Missing name" });
  try {
    const output = await run(`${CLI} lib uninstall "${name}"`);
    res.json({ success: true, output });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Start ──

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🔧 EduPrime Compile Server running on port ${PORT}`);
  // Pre-warm: install core on startup
  try {
    await ensureCore();
  } catch (e) {
    console.error("[Setup] Pre-warm failed:", e.message);
  }
});
