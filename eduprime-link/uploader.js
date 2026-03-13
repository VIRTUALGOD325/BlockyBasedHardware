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
function uploadFromCPP(code, port, onStatus) {
  return new Promise((resolve, reject) => {
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

    const compileCmd = `arduino-cli compile --fqbn arduino:avr:uno "${tempDir}"`

    exec(compileCmd, (compileErr, compileStdout, compileStderr) => {
      if (compileErr) {
        const errMsg = compileStderr || compileErr.message
        onStatus?.({ phase: 'compile', status: 'error', message: errMsg })
        reject(new Error(errMsg))
        return
      }

      onStatus?.({ phase: 'compile', status: 'done', message: compileStdout.trim() })

      // Disconnect serial port before uploading (port contention fix)
      const wasConnected = serial.isConnected()
      if (wasConnected) {
        serial.disconnect()
      }

      // Small delay for OS to release port
      setTimeout(() => {
        // --- Phase 2: Upload ---
        onStatus?.({ phase: 'upload', status: 'started', message: `Uploading to ${port}...` })

        const uploadCmd = `arduino-cli upload -p ${port} --fqbn arduino:avr:uno "${tempDir}"`

        exec(uploadCmd, (uploadErr, uploadStdout, uploadStderr) => {
          if (uploadErr) {
            const errMsg = uploadStderr || uploadErr.message
            onStatus?.({ phase: 'upload', status: 'error', message: errMsg })

            // Reconnect serial if it was connected before
            if (wasConnected) {
              setTimeout(() => serial.connect(port), 1000)
            }

            reject(new Error(errMsg))
            return
          }

          onStatus?.({ phase: 'upload', status: 'done', message: 'Upload successful!' })

          // Reconnect serial after successful upload
          if (wasConnected) {
            console.log('[uploader] Reconnecting serial...');
            setTimeout(() => {
              try {
                serial.connect(port);
                console.log('[uploader] Serial reconnected');
              } catch (e) {
                console.error('[uploader] Failed to reconnect serial:', e.message);
              }
            }, 1500)
          }

          resolve()
        })
      }, 500)
    })
  })
}

module.exports = { uploadFromCPP }