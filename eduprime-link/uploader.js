const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const serial = require('./serial')

/**
 * Compile and upload C++ code to an Arduino board.
 * @param {string} code - The C++ / .ino source code
 * @param {string} port - Serial port path (e.g. /dev/cu.usbmodem14101)
 * @param {function} onStatus - Callback for progress: ({ phase, status, message? })
 * @returns {Promise<void>}
 */
async function uploadFromCPP(code, port, onStatus) {
  const tempDir = path.join(os.tmpdir(), 'eduprime_sketch')
  const sketchPath = path.join(tempDir, 'eduprime_sketch.ino')

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  // Write code to sketch file
  fs.writeFileSync(sketchPath, code)

  // --- Phase 1: Compile ---
  onStatus?.({ phase: 'compile', status: 'started', message: 'Compiling sketch...' })

  const compileResult = await runCommand(
    `arduino-cli compile --fqbn arduino:avr:uno "${tempDir}"`,
    120000
  )

  if (compileResult.error) {
    const errMsg = compileResult.stderr || compileResult.error.message
    onStatus?.({ phase: 'compile', status: 'error', message: errMsg })
    throw new Error(errMsg)
  }

  onStatus?.({ phase: 'compile', status: 'done', message: compileResult.stdout.trim() })

  // Disconnect serial port before uploading (port contention fix)
  const wasConnected = serial.isConnected()
  if (wasConnected) {
    try {
      await serial.disconnect()
    } catch (e) {
      console.warn('[uploader] Disconnect warning:', e.message)
    }
  }

  // On macOS, use /dev/cu.* instead of /dev/tty.* — the tty variant
  // causes tcsetattr() failures with CH340/CH341 USB-serial adapters
  let uploadPort = port
  if (process.platform === 'darwin' && port.includes('/dev/tty.')) {
    uploadPort = port.replace('/dev/tty.', '/dev/cu.')
    console.log(`[uploader] macOS: using ${uploadPort} instead of ${port}`)
  }

  // Delay for OS to fully release the serial port
  await delay(1500)

  // --- Phase 2: Upload ---
  onStatus?.({ phase: 'upload', status: 'started', message: `Uploading to ${uploadPort}...` })

  const uploadResult = await runCommand(
    `arduino-cli upload -p ${uploadPort} --fqbn arduino:avr:uno "${tempDir}"`,
    120000
  )

  if (uploadResult.error) {
    const errMsg = uploadResult.stderr || uploadResult.error.message
    onStatus?.({ phase: 'upload', status: 'error', message: errMsg })

    // Reconnect serial if it was connected before
    if (wasConnected) {
      await reconnectSerial(port, 1000)
    }

    throw new Error(errMsg)
  }

  onStatus?.({ phase: 'upload', status: 'done', message: 'Upload successful!' })

  // Reconnect serial after successful upload
  if (wasConnected) {
    await reconnectSerial(port, 1500)
  }
}

/**
 * Attempt to reconnect serial with retries.
 */
async function reconnectSerial(port, initialDelay, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await delay(attempt === 1 ? initialDelay : 1000)
    try {
      await serial.connect(port)
      console.log(`[uploader] Serial reconnected (attempt ${attempt})`)
      return
    } catch (e) {
      console.warn(`[uploader] Reconnect attempt ${attempt}/${maxRetries} failed: ${e.message}`)
      if (attempt === maxRetries) {
        console.error('[uploader] Could not reconnect serial after upload')
      }
    }
  }
}

function runCommand(cmd, timeout = 120000) {
  return new Promise((resolve) => {
    const proc = exec(cmd, { timeout }, (error, stdout, stderr) => {
      resolve({ error, stdout: stdout || '', stderr: stderr || '' })
    })
  })
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { uploadFromCPP }
