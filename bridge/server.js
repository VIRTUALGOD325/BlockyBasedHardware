import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import { config, MESSAGE_TYPES } from "./config/constants.js";
import { boardManager } from "./utils/boardManager.js";
import apiRouter from "./routes/api.js";
import { handleCommand } from "./handlers/wsHandler.js";

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

class WebSocketServer {
  constructor() {
    this.clients = new Set();
    this.server = new WebSocketServer({ port });
  }

  onConnection(ws){
    this.clients.add(ws);
    ws.on('message', (raw)=>{
      const msg = JSON.parse(raw);
      this.handleCommand(msg,ws);
    })
    ws.on('close',()=>{
      this.clients.delete(ws)
    })
  }

  broadcast(message){
    this.clients.forEach( client => {
      client.send(JSON.stringify(message))
    })
  }
}

// WebSocket Connection Handling
wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  // Add client to board manager
  boardManager.addClient(ws);

  // Send current connection status to new client
  const boardInfo = boardManager.getBoardInfo();
  if (boardInfo) {
    ws.send(
      JSON.stringify({
        type: MESSAGE_TYPES.CONNECTED,
        board: boardInfo.type,
        timestamp: Date.now(),
      }),
    );
  }

  // Handle incoming messages
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      handleCommand(ws, message);
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ERROR,
          code: "PARSE_ERROR",
          message: error.message,
        }),
      );
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
    boardManager.removeClient(ws);
    boardManager.stopAllStreams();
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Initialize board connection
boardManager.initialize().catch((error) => {
  console.error("Failed to initialize board:", error);
});

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Bridge server running on http://localhost:${config.port}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${config.port}`);
  console.log(`📡 Attempting to connect to hardware board...`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  boardManager.close();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  boardManager.close();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
