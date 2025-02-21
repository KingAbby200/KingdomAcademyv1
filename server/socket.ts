import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import admin from "firebase-admin";
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';

console.log('Starting Socket.IO server initialization...');

// Initialize Firebase Admin with service account credentials
let firebaseInitialized = false;
try {
  if (!admin?.apps?.length) {
    console.log('Attempting to initialize Firebase Admin SDK...');
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.VITE_FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
      throw new Error('VITE_FIREBASE_PROJECT_ID is not set');
    }

    if (process.env.NODE_ENV === 'development' && (!clientEmail || !privateKey)) {
      console.warn('Running in development mode without full Firebase credentials');
      admin.initializeApp({
        projectId,
        credential: admin.credential.cert({
          projectId,
          clientEmail: `${projectId}@appspot.gserviceaccount.com`,
          privateKey: process.env.FIREBASE_PRIVATE_KEY || "dummy-key"
        }),
      });
    } else {
      const formattedKey = privateKey?.replace(/\\n/g, '\n') || '';
      admin.initializeApp({
        projectId,
        credential: admin.credential.cert({
          projectId,
          clientEmail: clientEmail || `${projectId}@appspot.gserviceaccount.com`,
          privateKey: formattedKey
        }),
      });
    }
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    firebaseInitialized = true;
    console.log('Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

// Socket.IO server instance
let io: Server;

// Rate limiter for Socket.IO events - Very lenient for real-time features
const rateLimiter = new RateLimiterMemory({
  points: 1000, // Increased from 300 to 1000 points
  duration: 60, // Per 60 seconds
  blockDuration: 30, // Reduced block duration to 30 seconds
});

// Separate rate limiter for authenticated users with much higher limits
const authenticatedRateLimiter = new RateLimiterMemory({
  points: 2000, // Doubled from 1000 to 2000 for authenticated users
  duration: 60,
  blockDuration: 15, // Even shorter block duration for authenticated users
});

// Active users map: socketId -> userId
const activeUsers = new Map<string, string>();

// Room participants map: roomId -> Set of socketIds
const roomParticipants = new Map<string, Set<string>>();

export function initializeSocketIO(httpServer: HTTPServer) {
  console.log('Configuring Socket.IO server...');

  io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Configure Socket.IO for auto-reconnection
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware to verify Firebase token or handle anonymous connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('Socket connection attempt:', socket.id);

      // Rate limiting check with different limits for authenticated users
      try {
        const limiter = token && firebaseInitialized ? authenticatedRateLimiter : rateLimiter;
        await limiter.consume(socket.handshake.address);
      } catch (error) {
        console.warn('Rate limit exceeded for:', socket.handshake.address);
        return next(new Error('Rate limit exceeded. Please try again later.'));
      }

      if (token && firebaseInitialized) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          socket.data.userId = decodedToken.uid;
          socket.data.authenticated = true;
          console.log('Authenticated socket connection:', socket.id);
        } catch (error) {
          console.warn('Token verification failed, falling back to anonymous:', error);
          socket.data.userId = `anonymous-${socket.id}`;
          socket.data.authenticated = false;
        }
      } else {
        socket.data.userId = `anonymous-${socket.id}`;
        socket.data.authenticated = false;
        console.log('Anonymous socket connection:', socket.id);
      }

      // Additional security checks
      if (!socket.data.userId) {
        return next(new Error('Invalid user identification'));
      }

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} (${socket.data.authenticated ? 'authenticated' : 'anonymous'})`);
    activeUsers.set(socket.id, userId);

    // Emit active users list
    io.emit("users:active", Array.from(activeUsers.values()));

    // Handle content updates
    socket.on("content:create", (data: { type: string; id: string | number }) => {
      io.emit("content:update", { type: data.type, id: data.id });
    });

    socket.on("content:update", (data: { type: string; id: string | number }) => {
      io.emit("content:update", { type: data.type, id: data.id });
    });

    socket.on("content:delete", (data: { type: string; id: string | number }) => {
      io.emit("content:update", { type: data.type, id: data.id });
    });

    // Handle joining breakout rooms
    socket.on("room:join", (roomId: string) => {
      console.log(`User ${userId} joining room ${roomId}`);
      socket.join(roomId);
      if (!roomParticipants.has(roomId)) {
        roomParticipants.set(roomId, new Set());
      }
      roomParticipants.get(roomId)?.add(socket.id);

      // Notify room participants
      io.to(roomId).emit("room:participants", {
        roomId,
        participants: Array.from(roomParticipants.get(roomId) || [])
          .map(socketId => ({
            id: activeUsers.get(socketId),
            name: `User ${socketId.slice(0, 6)}`,
            isAuthenticated: io.sockets.sockets.get(socketId)?.data.authenticated || false
          }))
      });
    });

    // Handle room messages
    socket.on("message:room", async ({ roomId, content }) => {
      console.log(`Message in room ${roomId} from ${userId}: ${content}`);
      io.to(roomId).emit("message:room", {
        senderId: userId,
        content,
        timestamp: Date.now()
      });
    });

    // Handle participant status updates
    socket.on("participant:toggleHand", ({ roomId }) => {
      io.to(roomId).emit("participant:status", {
        participantId: userId,
        status: "hand_raised"
      });
    });

    socket.on("participant:toggleMute", ({ roomId }) => {
      io.to(roomId).emit("participant:status", {
        participantId: userId,
        status: "muted"
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      activeUsers.delete(socket.id);

      // Remove from all rooms
      roomParticipants.forEach((participants, roomId) => {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);
          io.to(roomId).emit("room:participants", {
            roomId,
            participants: Array.from(participants)
              .map(socketId => ({
                id: activeUsers.get(socketId),
                name: `User ${socketId.slice(0, 6)}`,
                isAuthenticated: io.sockets.sockets.get(socketId)?.data.authenticated || false
              }))
          });
        }
      });

      io.emit("users:active", Array.from(activeUsers.values()));
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}