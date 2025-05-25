const { Server } = require("socket.io");

let io = null;

// Initialize Socket.IO server
const initializeWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join organization room when client connects
    socket.on("join-organization", (organizationId) => {
      socket.join(`org-${organizationId}`);
      console.log(`Client ${socket.id} joined org-${organizationId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

// Broadcast service status update
const broadcastServiceUpdate = (organizationId, service) => {
  if (io) {
    io.to(`org-${organizationId}`).emit("service-updated", service);
    console.log(`Broadcasted service update for org-${organizationId}`);
  }
};

// Broadcast incident created
const broadcastIncidentCreated = (organizationId, incident) => {
  if (io) {
    io.to(`org-${organizationId}`).emit("incident-created", incident);
    console.log(`Broadcasted incident created for org-${organizationId}`);
  }
};

// Broadcast incident updated
const broadcastIncidentUpdated = (organizationId, incident) => {
  if (io) {
    io.to(`org-${organizationId}`).emit("incident-updated", incident);
    console.log(`Broadcasted incident updated for org-${organizationId}`);
  }
};

module.exports = {
  initializeWebSocket,
  broadcastServiceUpdate,
  broadcastIncidentCreated,
  broadcastIncidentUpdated,
};
