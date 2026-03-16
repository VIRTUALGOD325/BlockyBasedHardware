
const { SerialPort } = require('serialport')

let activePort = null
let dataCallback = null

async function listPorts() {
  const ports = await SerialPort.list()
  return ports
}

function connect(portPath, baudRate = 9600) {
  // Close existing connection first
  if (activePort && activePort.isOpen) {
    activePort.close()
  }

  activePort = new SerialPort({
    path: portPath,
    baudRate
  })

  // Always re-attach the data callback to the new port instance
  if (dataCallback) {
    activePort.on('data', data => {
      dataCallback(data.toString())
    })
  }

  return activePort
}

function send(data) {
  if (activePort && activePort.isOpen) {
    activePort.write(data)
  }
}

function disconnect() {
  if (activePort && activePort.isOpen) {
    activePort.close()
    activePort = null
    return "disconnected"
  }
  return "no active port"
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
}

module.exports = { listPorts, connect, disconnect, send, setDataCallback, isConnected, getActivePort }