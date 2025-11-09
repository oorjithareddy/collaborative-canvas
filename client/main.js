/*
  main.js — connects frontend + server
*/

import CanvasBoard from "./canvas.js";
import { connectWebSocket, sendMessage } from "./websocket.js";

// get main elements
const canvas = document.getElementById("board");
const board = new CanvasBoard(canvas);

// toolbar refs
const colorPicker = document.getElementById("colorPicker");
const sizeRange = document.getElementById("sizeRange");
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

let activeTool = "brush"; // track mode

// color select
colorPicker.addEventListener("change", (e) => {
  board.setColor(e.target.value);
  activeTool = "brush";
  brushBtn.classList.add("active");
  eraserBtn.classList.remove("active");
});

// size slider
sizeRange.addEventListener("input", (e) => {
  const val = +e.target.value;
  board.setLineWidth(val);
});

// brush + eraser toggle
brushBtn.onclick = () => {
  activeTool = "brush";
  board.setColor(colorPicker.value);
  brushBtn.classList.add("active");
  eraserBtn.classList.remove("active");
};

eraserBtn.onclick = () => {
  activeTool = "eraser";
  board.setColor("#ffffff");
  eraserBtn.classList.add("active");
  brushBtn.classList.remove("active");
};

// undo/redo/clear
undoBtn.onclick = () => board.undo();
redoBtn.onclick = () => board.redo();
clearBtn.onclick = () => board.clear();

// connect to backend WS
connectWebSocket("ws://localhost:3000", {
  SYNC_STATE: (ops) => {
    board.strokes = ops;
    board._redraw();
  },

  STROKE: (stroke) => {
    document.dispatchEvent(
      new CustomEvent("remote_stroke", { detail: stroke })
    );
  },

  DRAW: (seg) => {
    const ctx = board.ctx;
    // eraser mode fix
    if (seg.color === "#ffffff") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000000";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = seg.color;
    }
    ctx.beginPath();
    ctx.moveTo(seg.start.x, seg.start.y);
    ctx.lineTo(seg.end.x, seg.end.y);
    ctx.lineWidth = seg.width;
    ctx.stroke();
  },

  CURSOR: (data) => {
    document.dispatchEvent(
      new CustomEvent("remote_cursor", { detail: data })
    );
  },

  PRESENCE: (list) => {
    document.dispatchEvent(
      new CustomEvent("remote_presence", { detail: list })
    );
  }
});

// send cursor live position
canvas.addEventListener("mousemove", (e) => {
  const pos = board._getPos(e);
  board.sendCursor(pos.x, pos.y);
});

// random user id (minor typo fixed)
setTimeout(() => {
  board.userId = Math.random().toString(36).slice(2, 8);
}, 500);
