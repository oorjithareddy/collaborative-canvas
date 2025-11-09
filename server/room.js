import { DrawingState } from "./drawing-state.js";

export const rooms = new Map();

export function getRoom(roomId = "default") {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      state: new DrawingState(),
      clients: new Set()
    });
  }
  return rooms.get(roomId);
}