/*
  drawing-state.js
*/

export class DrawingState {
  constructor() {
    // holds every stroke/action
    this.ops = [];
  }

  // apply an incoming operation to state
  apply(op) {
    switch (op.type) {
      case "STROKE": {
        this.ops.push({ ...op.payload, active: true });
        break;
      }

      case "UNDO": {
        const last = [...this.ops].reverse().find(x => x.active);
        if (last) last.active = false;
        break;
      }

      case "REDO": {
        const redoTarget = this.ops.find(x => !x.active);
        if (redoTarget) redoTarget.active = true;
        break;
      }

      case "CLEAR": {
        this.ops = []; // full reset
        break;
      }

      default:
        console.log("unknown op:", op);
    }
  }

  // return only active strokes
  getActiveStrokes() {
    return this.ops.filter(o => o.active);
  }

  // return everything (for syncing)
  getAllOps() {
    return this.ops;
  }
}
