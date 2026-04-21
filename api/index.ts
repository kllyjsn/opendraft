/**
 * Vercel serverless function — catch-all for the Express app.
 *
 * vercel.json rewrites `/api/(.*)` → `/api`, so every request path under
 * `/api/...` that does NOT match a more-specific file-based function
 * (e.g. `api/functions/stripe-webhook.ts`) ends up here. The Express
 * router then resolves the path the same way it does on a long-lived
 * Node server.
 *
 * Notes:
 *  - `await connectDB()` at module scope uses top-level await so the Mongo
 *    pool is warm before any request is handled on this container.
 *    `connectDB` caches the connection on `globalThis`, so subsequent
 *    invocations on the same warm container reuse the same pool.
 *  - The Stripe webhook route lives in a separate dedicated function
 *    (see `api/functions/stripe-webhook.ts`) because Vercel's default
 *    body handling makes raw-body access through Express brittle.
 */
import { createApp } from "../server/src/app.js";
import { connectDB } from "../server/src/lib/db.js";

await connectDB();

const app = createApp();

export default app;
