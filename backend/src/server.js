const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
const { initializeWebSocket } = require("./websocket");
initializeWebSocket(server);

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL, "https://your-frontend-domain.vercel.app"]
        : "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");
const organizationRoutes = require("./routes/organizations");
const serviceRoutes = require("./routes/services");
const incidentRoutes = require("./routes/incidents");
const teamRoutes = require("./routes/teams");

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Outager API is running!" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/teams", teamRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 8080;

// Use server.listen instead of app.listen for WebSocket support
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});
