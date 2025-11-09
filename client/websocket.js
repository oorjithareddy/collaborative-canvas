/*
  websocket.js 
*/

let ws = null;
let handlers = {};

// connect to backend socket
export function connectWebSocket(url, opts = {}) {
  ws = new WebSocket(url);
  handlers = opts;

  ws.onopen = () => {
    console.log("connected to websocket");
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      const fn = handlers[msg.type];
      if (typeof fn === "function") fn(msg.payload);
    } catch (err) {
      console.warn("error parsing ws message:", err);
    }
  };

  ws.onclose = () => {
    console.log("websocket closed, maybe refresh?");
  };

  ws.onerror = (e) => {
    console.error("websocket error:", e);
  };
}

// send message safely
export function sendMessage(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    console.log("socket not ready, skipping send");
  }
}
