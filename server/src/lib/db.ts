import mongoose from "mongoose";

/**
 * Serverless-safe MongoDB connection. Caches the connection promise
 * on `globalThis` so that a single Vercel container instance reuses
 * one pool across invocations (cold-start = new pool, warm = shared),
 * and concurrent cold-start requests await the SAME promise instead
 * of racing to open multiple pools and exhausting Atlas connection
 * limits.
 *
 * On a long-lived Node server the same caching is a no-op after the
 * first call.
 */
type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  __opendraftMongoose?: Cached;
};

const cached: Cached =
  globalForMongoose.__opendraftMongoose ??
  (globalForMongoose.__opendraftMongoose = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI environment variable is required");

    cached.promise = mongoose
      .connect(uri, {
        // Keep pool small in serverless; each container rarely needs
        // more than a few concurrent queries and Atlas free tier caps
        // total connections.
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log("Connected to MongoDB");
        return m;
      })
      .catch((err) => {
        // Don't cache a failed promise -- next call should retry.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
