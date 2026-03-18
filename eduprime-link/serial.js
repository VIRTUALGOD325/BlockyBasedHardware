
const { SerialPort } = require('serialport')

let activePort = null
let dataCallback = null
let eventCallback = null

async function listPorts() {
  const ports = await SerialPort.list()
  return ports
}

/**
 * Connect to a serial port. Returns a promise that resolves when the port
 * is actually open, or rejects on error.
 */
function connect(portPath, baudRate = 9600) {
  return new Promise((resolve, reject) => {
    // Close existing connection first
    if (activePort) {
      try {
        activePort.removeAllListeners()
        if (activePort.isOpen) activePort.close()
      } catch {
        // Ignore cleanup errors
      }
      activePort = null
    }

    activePort = new SerialPort({
      path: portPath,
      baudRate,
      autoOpen: false
    })

    activePort.on('open', () => {
      console.log(`[Serial] Port ${portPath} opened at ${baudRate} baud`)
      resolve(activePort)
    })

    activePort.on('error', (err) => {
      console.error(`[Serial] Port error: ${err.message}`)
      if (eventCallback) eventCallback('error', err.message)
    })

    activePort.on('close', () => {
      console.log('[Serial] Port closed')
      activePort = null
      if (eventCallback) eventCallback('close')
    })

    // Attach data callback
    if (dataCallback) {
      activePort.on('data', data => {
        dataCallback(data.toString())
      })
    }

    activePort.open((err) => {
      if (err) {
        console.error(`[Serial] Failed to open ${portPath}: ${err.message}`)
        activePort = null
        reject(err)
      }
    })
  })
}

function send(data) {
  if (activePort && activePort.isOpen) {
    activePort.write(data, (err) => {
      if (err) {
        console.error(`[Serial] Write error: ${err.message}`)
        if (eventCallback) eventCallback('error', err.message)
      }
    })
  }
}

function disconnect() {
  return new Promise((resolve) => {
    if (activePort && activePort.isOpen) {
      activePort.close((err) => {
        if (err) {
          console.error(`[Serial] Close error: ${err.message}`)
        }
        activePort = null
        resolve('disconnected')
      })
    } else {
      activePort = null
      resolve('no active port')
    }
  })
}

function isConnected() {
  return activePort && activePort.isOpen
}

function getActivePort() {
  return activePort
}

/**
 * Register a callback for incoming serial data.
 * Replaces any previous callback (single-writer).
 */
function setDataCallback(callback) {
  dataCallback = callback
  // Re-attach to active port if one exists
  if (activePort) {
    activePort.removeAllListeners('data')
    activePort.on('data', data => {
      dataCallback(data.toString())
    })
  }
}

/**
 * Register a callback for port lifecycle events (error, close).
 * callback(event: 'error'|'close', message?: string)
 */
function setEventCallback(callback) {
  eventCallback = callback
}

module.exports = { listPorts, connect, disconnect, send, setDataCallback, setEventCallback, isConnected, getActivePort }