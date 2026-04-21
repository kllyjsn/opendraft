import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import profileRoutes from "./routes/profiles.js";
import conversationRoutes from "./routes/conversations.js";
import organizationRoutes from "./routes/organizations.js";
import generalRoutes from "./routes/general.js";
import { stripeRouter, handleStripeWebhook } from "./routes/stripe.js";
import { freeTierRouter } from "./routes/freeTier.js";

/**
 * Factory that returns a configured Express `app`. Does NOT call
 * `.listen()`, does NOT connect to MongoDB. The caller is responsible
 * for:
 *   - ensuring `connectDB()` has been awaited before the first request
 *     is served (serverless cold-start path does this per-invocation;
 *     the long-lived Node entry in `index.ts` does it once at boot)
 *   - either calling `.listen()` (Node server) or exporting as a
 *     serverless function handler (Vercel).
 *
 * Keeps Fly-style and Vercel-style deploys on identical middleware /
 * routing so behavior is provably equivalent.
 */
export function createApp(): express.Express {
  const app = express();

  const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  )
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

  // Stripe webhook MUST receive the raw request body so its signature
  // header can be verified. Register BEFORE the global express.json().
  app.post(
    "/api/functions/stripe-webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/listings", listingRoutes);
  app.use("/api/profiles", profileRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/organizations", organizationRoutes);
  // Named /api/functions routers must mount BEFORE the generalRoutes
  // catch-all for /functions/:functionName.
  app.use("/api/functions", stripeRouter);
  app.use("/api/functions", freeTierRouter);
  app.use("/api", generalRoutes);

  return app;
}
