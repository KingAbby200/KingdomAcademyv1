import { io, Socket } from "socket.io-client";
import { auth } from "./firebase";

let socket: Socket | null = null;

export async function initializeSocket() {
  if (socket) return socket;

  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to connect to Socket.IO");
  }

  const token = await user.getIdToken();

  socket = io({
    path: "/socket.io/",
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log("Connected to Socket.IO server");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
    throw new Error("Failed to connect to room server");
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected from Socket.IO server:", reason);
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    throw new Error("Socket.IO has not been initialized. Call initializeSocket first.");
  }
  return socket;
}

// Room management
export function joinRoom(roomId: string) {
  const socket = getSocket();
  socket.emit("room:join", { roomId });
}

export function leaveRoom(roomId: string) {
  const socket = getSocket();
  socket.emit("room:leave", { roomId });
}

// Messaging
export function sendDirectMessage(recipientId: string, content: string) {
  const socket = getSocket();
  socket.emit("message:direct", { recipientId, content });
}

export function sendRoomMessage(roomId: string, content: string) {
  const socket = getSocket();
  socket.emit("message:room", { roomId, content });
}

// Utility function to subscribe to events
export function subscribeToEvent<T>(event: string, callback: (data: T) => void) {
  const socket = getSocket();
  socket.on(event, callback);
  return () => socket.off(event, callback);
}

// Export the socket instance for direct access
export { socket };