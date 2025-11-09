# Architecture Documentation

This document explains the overall architecture, data flow, and design decisions for the **Real-Time Collaborative Drawing Canvas**.  
It describes how different components interact to enable multi-user real-time drawing synchronization using WebSockets.

---

## Overview

The application follows a **client-server model** where:

- The **client** handles all user interactions, drawing actions, and real-time updates on the canvas.
- The **server** manages connected clients, stores drawing state in memory, and ensures all users stay synchronized.

All communication between the client and server takes place over WebSockets using a lightweight custom protocol.

---

## Data Flow

1. A user performs a drawing action on the client canvas.
2. The client sends stroke data (coordinates, color, width) to the server.
3. The server updates its internal drawing state.
4. The server broadcasts the update to all connected clients.
5. All clients update their canvases accordingly.

---

## WebSocket Protocol

The system uses JSON-based messages exchanged between the client and server.  
Each message has a `type` field and an optional `payload` containing relevant data.

### Message Types

| Type | Direction | Description |
|------|------------|-------------|
| `DRAW` | Client → Server | Sends live drawing segments while the user is dragging. |
| `STROKE` | Client → Server | Sends a complete stroke after mouse release. |
| `SYNC_STATE` | Server → Client | Sends the entire canvas state to all clients for synchronization. |
| `UNDO` | Client ↔ Server | Undo the most recent stroke globally. |
| `REDO` | Client ↔ Server | Redo the most recently undone stroke globally. |
| `CLEAR` | Client ↔ Server | Clears the entire canvas for all users. |
| `CURSOR` | Client ↔ Server | Transmits current cursor positions for active users. |
| `PRESENCE` | Server → Client | Sends the list of currently connected users. |

---

## Undo/Redo Strategy

The undo/redo mechanism is managed on the server using the **DrawingState** module.

- Each stroke is stored as an object with its points, color, and width.
- Each stroke also contains an `active` flag to indicate visibility.
- **Undo:** Marks the most recent active stroke as inactive.
- **Redo:** Reactivates the most recently undone stroke.
- The updated state is broadcast to all connected clients to ensure a consistent shared canvas.

This stroke-based approach avoids the need to store raw pixel data, making synchronization faster and lighter.

---

## Components Overview

### 1. Client-Side Components

**index.html**  
Defines the structure of the canvas and toolbar with basic controls for color, size, undo, redo, and clear.

**style.css**  
Handles layout styling, toolbar design, and positioning of cursor indicators for multiple users.

**main.js**  
Initializes the drawing board, connects to the WebSocket server, and binds UI interactions (color picker, eraser, etc.).

**canvas.js**  
Implements drawing logic using the HTML5 Canvas API.  
Handles local rendering, stroke recording, undo/redo behavior, and sending messages to the WebSocket layer.

**websocket.js**  
Manages the WebSocket connection, message parsing, and routing messages between client logic and the server.

---

### 2. Server-Side Components

**server.js**  
Runs an Express server with a WebSocket layer.  
Manages client connections, message handling, and broadcasting updates to all clients.

**drawing-state.js**  
Acts as the in-memory database for all drawing operations.  
Handles stroke storage, undo/redo functionality, and provides the synchronized state to new clients.

**room.js**  
Manages client groups (rooms) and maintains which users are currently connected.

---

## Performance Decisions

1. **Local Rendering:**  
   Drawing is rendered immediately on the local canvas before being sent to the server. This ensures smooth and responsive drawing.

2. **Throttled Network Messages:**  
   The system limits how often drawing data is sent (around every 16ms) to prevent flooding the network.

3. **Lightweight Data Transmission:**  
   Instead of sending pixel data, only simple coordinate pairs, color, and width are sent.

4. **Efficient Redrawing:**  
   The entire drawing can be reconstructed easily from stored stroke data, allowing resizing or synchronization without data loss.

5. **No External Libraries:**  
   Using only native WebSocket APIs and the Canvas API provides full control over optimization and transparency in communication.

---

## Conflict Resolution

When multiple users draw at the same time, each stroke is recorded independently with its own timestamp.  
Since canvas rendering is order-based, the natural draw sequence creates the correct overlap visually.  
Undo/redo operations are handled globally to maintain a consistent shared state for all users.

---

## Scalability Considerations

For scalability and production readiness, the following steps can be taken:

- **Persistent Storage:** Use a database like MongoDB or Redis to store strokes permanently.  
- **Room System:** Allow multiple separate drawing rooms for different user groups.  
- **Optimized Broadcasting:** Replace direct broadcasts with message queues for larger user bases.  
- **Compression:** Compress WebSocket messages for bandwidth efficiency.  
- **Load Balancing:** Deploy multiple WebSocket servers managed by a reverse proxy.

---

## Limitations

- The current implementation uses in-memory storage, so drawings are lost when the server restarts.  
- Undo and redo actions apply globally, not per-user.  
- No authentication or identity persistence is implemented.  
- The system is designed primarily for local or small-group collaboration, not large-scale deployment.

---

## Conclusion

This architecture was designed to keep things simple and transparent while demonstrating the fundamentals of real-time systems.  
It uses pure JavaScript and the native WebSocket API to achieve live synchronization and shared state management.  
The project structure is modular, making it easy to extend for future features like shape tools, fill options, and persistent storage.

---

## Author

**Oorjitha Bhimavarapu**  
B.Tech Electronics and Computer Engineering
Amrita Vishwa Vidyapeetham
Bengaluru, Karnataka, India  

This project helped in understanding real-time systems, client-server data flow, and canvas manipulation using native JavaScript.
