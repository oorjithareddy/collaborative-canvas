/*
  server.js
*/

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { getRoom } from "./room.js";

// boilerplate paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// setup app + ws server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// serve frontend
app.use(express.static(path.join(__dirname, "..", "client")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

// connected users map
const users = new Map();

// main websocket logic
wss.on("connection", (ws) => {
  const id = Math.random().toString(36).slice(2, 8);
  const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  const user = { id, color, name: `User-${id.slice(0, 4)}` };

  users.set(ws, user);
  const room = getRoom("default");
  room.clients.add(ws);

  console.log(`${user.name} joined. Total users: ${room.clients.size}`);

  // send existing strokes/state
  ws.send(JSON.stringify({ type: "SYNC_STATE", payload: room.state.getAllOps() }));
  broadcastPresence(room);

  // handle events
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg, room);
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`${user.name} left.`);
    users.delete(ws);
    room.clients.delete(ws);
    broadcastPresence(room);
  });

  ws.on("error", (err) => console.error("WebSocket error:", err));
});

// process incoming messages
function handleMessage(ws, msg, room) {
  const user = users.get(ws);
  if (!user) return;

  switch (msg.type) {
    case "DRAW":
      broadcast(room, { type: "DRAW", payload: msg.payload }, ws);
      break;

    case "STROKE":
      room.state.apply({ type: "STROKE", payload: msg.payload });
      broadcast(room, { type: "SYNC_STATE", payload: room.state.getAllOps() });
      break;

    case "UNDO":
      room.state.apply({ type: "UNDO" });
      broadcast(room, { type: "SYNC_STATE", payload: room.state.getAllOps() });
      break;

    case "REDO":
      room.state.apply({ type: "REDO" });
      broadcast(room, { type: "SYNC_STATE", payload: room.state.getAllOps() });
      break;

    case "CLEAR":
      room.state.apply({ type: "CLEAR" });
      broadcast(room, { type: "SYNC_STATE", payload: [] });
      break;

    case "CURSOR":
      broadcast(
        room,
        {
          type: "CURSOR",
          payload: {
            userId: user.id,
            x: msg.payload.x,
            y: msg.payload.y,
            color: user.color,
          },
        },
        ws
      );
      break;

    default:
      console.warn("Unknown message:", msg.type);
  }
}

// helper: send data to all clients in the same room
function broadcast(room, msg, exclude = null) {
  const data = JSON.stringify(msg);
  room.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// send list of active users
function broadcastPresence(room) {
  const list = Array.from(users.entries())
    .filter(([ws]) => room.clients.has(ws))
    .map(([, u]) => ({
      id: u.id,
      name: u.name,
      color: u.color
    }));

  broadcast(room, { type: "PRESENCE", payload: list });
}

// start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server live at http://localhost:${PORT}`);
  console.log("Open two tabs to test live drawing!");
});
