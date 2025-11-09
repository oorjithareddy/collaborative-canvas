# Real-Time Collaborative Drawing Canvas

This project is a real-time collaborative drawing web application made using HTML, CSS, JavaScript, and Node.js.  
Multiple users can draw together on the same canvas in real time using WebSockets for synchronization.  
No frameworks or external libraries like Socket.io were used. The focus was to build the synchronization manually using native WebSocket communication.

---

## Setup Instructions

1. **Clone the repository**

   
   git clone https://github.com/oorjithareddy/collaborative-canvas
   
   cd collaborative-canvas
   

3. **Install the dependencies**

   
   npm install
   

4. **Run the server**

   
   npm start
   

5. **Open the application**

   Open your browser and visit:  
   http://localhost:3000

To test the collaborative feature, open this URL in multiple browser tabs or different systems connected to the same network.

---

## Features

* Draw on the shared canvas in real time
* Change brush color and stroke width
* Use eraser to remove parts of the drawing
* Undo and redo actions
* Clear the entire canvas
* Display active users and their cursor positions
* Synchronization across all connected clients

---

## How It Works

Each user connects to the server through a WebSocket connection.  
When a user draws, the drawing data (points, color, width) is sent to the server.  
The server broadcasts this data to all other connected clients.  
As a result, every user’s canvas stays updated in real time.

When a new user joins, the server sends the complete canvas state to them so they can see the existing drawing immediately.  
The server maintains the strokes in memory and synchronizes them between users.

---

## Undo and Redo Strategy

* Each stroke is stored as an object containing its points, color, and width.
* Every stroke also includes an `active` flag.
* Undo marks the last active stroke as inactive.
* Redo reactivates the last undone stroke.
* The updated state is broadcast to all users, ensuring that all canvases stay consistent.

---

## Performance Choices

* The drawing is first rendered locally for smoothness.
* Only minimal data (coordinates, color, width) is sent to the server.
* Message sending is slightly throttled to reduce unnecessary WebSocket traffic.
* Canvas automatically resizes and redraws existing strokes.
* All operations are handled without using external drawing libraries.

---

## Testing the Application

1. Run the application using:

   
   npm start
   

2. Open multiple tabs or browsers and visit:

   http://localhost:3000

3. Draw on one tab and see it update live on all others.  
4. Try undo, redo, and clear to test synchronization.

---

## Known Limitations

* Undo and redo affect the shared canvas globally.
* Canvas data is not saved permanently.
* No authentication or session handling.
* Small latency differences can occur depending on network speed.

---

## Future Improvements

* Add support for drawing shapes (rectangle, circle, line).
* Add fill color and text tool.
* Implement per-user undo/redo.
* Save and restore drawings from a database.
* Improve drawing smoothing and latency handling.

---

## Time Spent

| Task                              | Duration           |
| -------------------------------- | ------------------ |
| Canvas drawing and event handling | 2 hours            |
| WebSocket setup and testing       | 2 hours            |
| Undo/Redo logic                   | 1.5 hours          |
| Toolbar setup                     | 1 hour             |
| Testing and debugging             | 1.5 hours          |
| Total                             | Around 8 hours     |

---

## Architecture Overview

The application is built using a client-server model with WebSocket-based real-time communication.

### Client-Side Architecture

* **index.html**: Provides the main UI layout containing the canvas and toolbar.  
* **style.css**: Defines layout styles, tool positions, and a responsive design.  
* **main.js**: Initializes the drawing tools, color pickers, and event listeners.  
* **canvas.js**: Handles all drawing operations, stroke rendering, undo/redo functionality, and resizing.  
* **websocket.js**: Manages client-server WebSocket communication, sending and receiving drawing data.

### Server-Side Architecture

* **server.js**: The entry point using Node.js and native WebSocket. Handles client connections, message routing, and broadcasting updates.
* **drawing-state.js**: Maintains in-memory storage for all strokes, undo/redo state, and synchronization.
* **room.js**: Manages connected users, handles join/leave events, and ensures consistent canvas updates for all active sessions.

### Data Flow

1. User draws on the canvas.  
2. The `canvas.js` sends stroke data to `websocket.js`.  
3. `websocket.js` transmits it to the server through a WebSocket message.  
4. The server receives this message in `server.js` and updates the global drawing state maintained by `drawing-state.js`.  
5. The server broadcasts the updated data to all connected clients.  
6. Each client updates their local canvas to reflect the new changes.

### Design Choices

* **Custom WebSocket Server:** Built from scratch instead of using Socket.io for deeper understanding of the protocol.  
* **Memory Persistence:** The drawing state is maintained in memory to simplify real-time performance.  
* **Stroke-based System:** Each stroke is stored as a distinct object to enable easy undo/redo operations.  
* **Global Synchronization:** All clients share the same canvas state to ensure collaborative consistency.

---

## Scalability and Future Plans

* Shift from in-memory storage to a database-based persistence layer (MongoDB or Redis).  
* Add room-based collaboration to support multiple canvases simultaneously.  
* Introduce rate-limiting and compression for message exchange.  
* Modularize code further for cleaner scalability.  
* Implement offline synchronization using local caching.

---

## Author

Oorjitha Bhimavarapu  
B.Tech Electronics and Computer Engineering
Amrita Vishwa Vidyapeetham
Bengaluru, Karnataka, India  

This project helped me understand real-time synchronization using WebSockets, canvas rendering, and managing multiple client updates efficiently without frameworks.
