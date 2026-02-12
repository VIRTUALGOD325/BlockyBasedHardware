# Bridge Server

Node.js bridge server with modular architecture for hardware communication.

## Project Structure

```
bridge/
├── server.js           # Main entry point
├── config/
│   └── constants.js    # Configuration and constants
├── utils/
│   └── boardManager.js # Board state management
├── handlers/
│   ├── wsHandler.js    # WebSocket message router
│   └── commandHandlers.js # Hardware command handlers
└── routes/
    └── api.js         # Express API endpoints
```

## Running the Server

```bash
# Install dependencies
npm install

# Start server
npm start

# Development with auto-reload
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/devices` - List connected devices
- `GET /api/status` - Server and board status

## WebSocket Commands

See `protocol.md` for full protocol specification.
