//canvas.js - collaborative board logic

import { sendMessage } from "./websocket.js";

class CanvasBoard {
  constructor(canvasEl) {
    // setup
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d");

    // default brush settings
    this.brushClr = "#000000";
    this.penSize = 5;

    // drawing state
    this.isDrawing = false;
    this.prev = null;
    this.activeStroke = null;
    this.strokes = [];
    this.redoStack = [];

    // user + remote stuff
    this.userId = null;
    this.cursors = new Map();
    this.lastDrawTime = 0;

    // init
    this._setupCanvas();
    this._bindEvents();
    this._listenRemote();
  }

  _setupCanvas() {
    this._resizeCanvas();
    window.addEventListener("resize", () => this._resizeCanvas());
    this.ctx.lineCap = this.ctx.lineJoin = "round";
  }

  _resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    if (this.canvas.width === w && this.canvas.height === h) return;

    const saved = this.strokes.slice();
    this.canvas.width = w;
    this.canvas.height = h;
    this._redraw(saved);
  }

  _bindEvents() {
    const start = (e) => this._startDraw(e);
    const move = (e) => this._drawMove(e);
    const end = () => this._endDraw();

    // mouse + touch
    this.canvas.addEventListener("mousedown", start);
    this.canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      start(e.touches[0]);
    });
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      move(e.touches[0]);
    });
    this.canvas.addEventListener("touchend", end);
  }

  _listenRemote() {
    document.addEventListener("remote_stroke", (e) => this._applyRemoteStroke(e.detail));
    document.addEventListener("remote_cursor", (e) => this._updateCursor(e.detail));
    document.addEventListener("remote_presence", (e) => this._updatePresence(e.detail));
  }

  _startDraw(e) {
    this.isDrawing = true;
    this.prev = this._getPos(e);
    this.activeStroke = {
      id: crypto.randomUUID(),
      color: this.brushClr,
      width: this.penSize,
      points: [this.prev]
    };
  }

  // smooth continuous stroke fix
  _drawMove(e) {
    if (!this.isDrawing) return;
    const pos = this._getPos(e);
    const now = performance.now();

    // draw locally each move - avoids "broken" look
    this.ctx.beginPath();
    this.ctx.moveTo(this.prev.x, this.prev.y);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.strokeStyle = this.brushClr;
    this.ctx.lineWidth = this.penSize;
    this.ctx.stroke();

    // store & maybe send
    this.activeStroke.points.push(pos);
    if (!this.lastDrawTime || now - this.lastDrawTime > 16) {
      sendMessage({
        type: "DRAW",
        payload: {
          start: this.prev,
          end: pos,
          color: this.brushClr,
          width: this.penSize
        }
      });
      this.lastDrawTime = now;
    }
    this.prev = pos;
  }

  _endDraw() {
    if (!this.isDrawing || !this.activeStroke) return;
    this.isDrawing = false;

    if (this.activeStroke.points.length > 1) {
      this.strokes.push(this.activeStroke);
      this.redoStack = [];
      sendMessage({ type: "STROKE", payload: this.activeStroke });
    }

    // cleanup
    this.activeStroke = null;
    this.prev = null;
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  _applyRemoteStroke(stroke) {
    // skip if we already have it
    if (this.strokes.find(s => s.id === stroke.id)) return;
    this.strokes.push(stroke);
    this._redrawSegment(stroke.points, stroke.color, stroke.width);
  }

  _redrawSegment(points, clr, width) {
    if (points.length < 2) return;
    this.ctx.globalCompositeOperation = (clr === "#ffffff") ? "destination-out" : "source-over";
    this.ctx.strokeStyle = (clr === "#ffffff") ? "#000000" : clr;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
    this.ctx.stroke();
  }

  undo() { sendMessage({ type: "UNDO" }); }
  redo() { sendMessage({ type: "REDO" }); }

  clear(broadcast = true) {
    this.strokes = [];
    this.redoStack = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (broadcast) sendMessage({ type: "CLEAR" });
  }

  _redraw(strokes = this.strokes.filter(s => s.active !== false)) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const s of strokes) this._redrawSegment(s.points, s.color, s.width);
  }

  setColor(c) {
    this.brushClr = c;
    this.ctx.globalCompositeOperation = c === "#ffffff" ? "destination-out" : "source-over";
  }

  setLineWidth(w) { this.penSize = w; }

  _updateCursor({ userId, x, y, color }) {
    if (userId === this.userId) return;
    let el = this.cursors.get(userId);
    if (!el) {
      el = document.createElement("div");
      el.className = "cursor";
      el.style.background = color;
      document.body.appendChild(el);
      this.cursors.set(userId, el);
    }
    const rect = this.canvas.getBoundingClientRect();
    el.style.left = rect.left + x + "px";
    el.style.top = rect.top + y + "px";
  }

  _updatePresence(users) {
    const container = document.getElementById("presence");
    container.innerHTML = "";
    users.forEach(u => {
      if (u.id === this.userId) return;
      const badge = document.createElement("div");
      badge.className = "user-badge";
      badge.style.background = u.color;
      badge.textContent = u.name;
      container.appendChild(badge);
    });
  }

  sendCursor(x, y) {
    // optional: send less frequently if lag appears
    sendMessage({ type: "CURSOR", payload: { x, y } });
  }
}

export default CanvasBoard;
