/**
 * Vercel serverless function — dedicated Stripe webhook receiver.
 *
 * Why separate from the Express catch-all: Vercel's default behavior on
 * `@vercel/node` does not reliably preserve the raw request body through
 * to Express middleware. Stripe signature verification requires the
 * EXACT payload bytes, so we bypass Express here and consume the raw
 * body directly from the Node stream, then delegate to the shared
 * `processStripeWebhook` core function.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../../server/src/lib/db.js";
import { processStripeWebhook } from "../../server/src/routes/stripe.js";

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  // Some Vercel runtime versions expose rawBody directly.
  const maybeRaw = (req as unknown as { rawBody?: Buffer | string }).rawBody;
  if (maybeRaw) {
    return typeof maybeRaw === "string" ? Buffer.from(maybeRaw) : maybeRaw;
  }
  // Fallback: read the stream ourselves.
  const chunks: Buffer[] = [];
  for await (const chunk of req as unknown as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    await connectDB();
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"] as string | undefined;
    const result = await processStripeWebhook(rawBody, signature);
    res.status(result.status).json(result.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    res.status(500).json({ error: message });
  }
}
