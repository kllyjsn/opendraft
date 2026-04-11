import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import profileRoutes from "./routes/profiles.js";
import conversationRoutes from "./routes/conversations.js";
import organizationRoutes from "./routes/organizations.js";
import generalRoutes from "./routes/general.js";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api", generalRoutes);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
