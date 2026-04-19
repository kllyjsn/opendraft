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
import { freeTierRouter } from "./routes/freeTier.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Comma-separated list of allowed origins (FRONTEND_URL or ALLOWED_ORIGINS).
// Always include localhost for dev. Production origin is https://opendraft.co.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header) and any listed origin.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
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
// Free-tier backed functions (claim free listing, get download URL) — must
// be mounted BEFORE the generalRoutes catch-all for /functions/:functionName.
app.use("/api/functions", freeTierRouter);
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
