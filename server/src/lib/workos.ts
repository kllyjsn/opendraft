import { WorkOS } from "@workos-inc/node";

const apiKey = process.env.WORKOS_API_KEY || "";
export const workos = new WorkOS(apiKey);
export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID || "";
export const WORKOS_REDIRECT_URI = process.env.WORKOS_REDIRECT_URI || "http://localhost:5173/auth/callback";
