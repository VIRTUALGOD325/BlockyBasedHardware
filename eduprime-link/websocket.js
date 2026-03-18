const WebSocket = require('ws')

// Lazy-load serial and uploader so a native-module failure
// doesn't prevent the WebSocket server from starting.
let serial, uploader
try {
  serial = require('./serial')
  uploader = require('./uploader')
} catch (err) {
  console.error('[WS] Failed to load serial/uploader modules:', err.message)
  serial = null
  uploader = null
}

let wss = null

/**
 * Broadcasts a message to all connected WebSocket clients.
 */
function broadcast(data) {
  if (!wss) return
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

/**
 * Attach the WebSocket server to an existing HTTP server.
 * This shares the same port, avoiding mixed-content / cross-port issues.
 */
function attachToServer(httpServer) {
  wss = new WebSocket.Server({ server: httpServer })

  wss.on('error', (err) => {
    console.error('[WS] WebSocket server error:', err.message)
  })

  // Register serial port lifecycle events once — broadcast to all clients
  if (serial) {
    serial.setEventCallback((event, message) => {
      if (event === 'error') {
        broadcast({ type: 'ERROR', message: `Serial port error: ${message}` })
      } else if (event === 'close') {
        broadcast({ type: 'DISCONNECTED', message: 'Serial port closed unexpectedly' })
      }
    })
  }

  // Heartbeat: detect dead clients
  const HEARTBEAT_INTERVAL = 15000
  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        console.log('[WS] Terminating unresponsive client')
        return ws.terminate()
      }
      ws.isAlive = false
      ws.ping()
    })
  }, HEARTBEAT_INTERVAL)

  wss.on('close', () => clearInterval(heartbeat))

  wss.on('connection', ws => {
    console.log('[WS] Client connected')
    ws.isAlive = true
    ws.on('pong', () => { ws.isAlive = true })

    // Register a single data callback for this WebSocket client.
    if (serial) {
      serial.setDataCallback((data) => {
        broadcast({ type: 'SERIAL_DATA', data })
      })
    }

    ws.on('message', async message => {
      let msg
      try {
        msg = JSON.parse(message.toString())
      } catch (e) {
        safeSend(ws, { type: 'ERROR', message: 'Invalid JSON' })
        return
      }

      const { type, requestId } = msg

      // If serial modules failed to load, reject hardware commands gracefully
      if (!serial && ['LIST_PORTS', 'CONNECT', 'DISCONNECT', 'SEND_DATA', 'UPLOAD_CODE'].includes(type)) {
        safeSend(ws, { type: 'ERROR', message: 'Serial module not available. Restart EduPrime Link.', requestId })
        return
      }

      switch (type) {

        case 'LIST_PORTS': {
          try {
            const ports = await serial.listPorts()
            safeSend(ws, { type: 'PORTS', data: ports, requestId })
          } catch (e) {
            safeSend(ws, { type: 'ERROR', message: e.message, requestId })
          }
          break
        }

        case 'CONNECT': {
          try {
            await serial.connect(msg.port, msg.baudRate || 9600)
            safeSend(ws, { type: 'CONNECTED', port: msg.port, requestId })
          } catch (e) {
            safeSend(ws, { type: 'ERROR', message: `Failed to connect: ${e.message}`, requestId })
          }
          break
        }

        case 'DISCONNECT': {
          try {
            const result = await serial.disconnect()
            safeSend(ws, { type: 'DISCONNECTED', message: result, requestId })
          } catch (e) {
            safeSend(ws, { type: 'ERROR', message: e.message, requestId })
          }
          break
        }

        case 'SEND_DATA': {
          serial.send(msg.payload)
          break
        }

        case 'UPLOAD_CODE': {
          const { code, port } = msg
          if (!code || !port) {
            safeSend(ws, { type: 'ERROR', message: 'Missing code or port', requestId })
            break
          }
          if (!uploader) {
            safeSend(ws, { type: 'ERROR', message: 'Uploader module not available.', requestId })
            break
          }

          try {
            await uploader.uploadFromCPP(code, port, (status) => {
              if (status.phase === 'compile') {
                safeSend(ws, {
                  type: 'COMPILE_STATUS',
                  status: status.status,
                  message: status.message,
                  requestId
                })
              } else if (status.phase === 'upload') {
                safeSend(ws, {
                  type: 'UPLOAD_STATUS',
                  status: status.status,
                  message: status.message,
                  requestId
                })
              }

              broadcast({
                type: 'UPLOAD_STATUS_EVENT',
                status: status
              })
            })
          } catch (e) {
            console.error('[WS] Upload error:', e.message)
          }
          break
        }

        case 'SEND_CODE': {
          if (msg.code) {
            broadcast({ type: 'CODE_RECEIVED', code: msg.code })
          }
          break
        }

        case 'PING': {
          safeSend(ws, { type: 'PONG', requestId })
          break
        }

        default:
          safeSend(ws, { type: 'ERROR', message: `Unknown message type: ${type}` })
      }
    })

    ws.on('close', () => {
      console.log('[WS] Client disconnected')
    })

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message)
    })

    // Send ready signal
    safeSend(ws, { type: 'READY' })
  })

  console.log('[WS] WebSocket server attached to HTTP server')
}

function safeSend(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

module.exports = { attachToServer }
