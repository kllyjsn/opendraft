import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) throw new Error("JWT_SECRET environment variable is required");
const JWT_SECRET: string = JWT_SECRET_RAW;

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
      req.userId = decoded.sub;
      req.userEmail = decoded.email;
    } catch {
      // Token invalid — continue without auth
    }
  }
  next();
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: "7d" });
}
