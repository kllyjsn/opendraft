import { Router, Request, Response } from "express";
import { workos, WORKOS_CLIENT_ID, WORKOS_REDIRECT_URI } from "../lib/workos.js";
import { generateToken, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { User, Profile } from "../models/index.js";

const router = Router();

// GET /api/auth/login — Redirect to WorkOS hosted auth
router.get("/login", (_req: Request, res: Response) => {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    clientId: WORKOS_CLIENT_ID,
    redirectUri: WORKOS_REDIRECT_URI,
  });
  res.json({ url: authorizationUrl });
});

// GET /api/auth/login/google — Google OAuth via WorkOS
router.get("/login/google", (_req: Request, res: Response) => {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "GoogleOAuth",
    clientId: WORKOS_CLIENT_ID,
    redirectUri: WORKOS_REDIRECT_URI,
  });
  res.json({ url: authorizationUrl });
});

// POST /api/auth/callback — Exchange code for user + JWT
router.post("/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    const { user: workosUser } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: WORKOS_CLIENT_ID,
    });

    // Find or create user in MongoDB
    let user = await User.findOne({ workos_id: workosUser.id });
    if (!user) {
      user = await User.create({
        workos_id: workosUser.id,
        email: workosUser.email,
        email_verified: workosUser.emailVerified,
      });
      // Create default profile
      await Profile.create({
        user_id: user._id.toString(),
        username: workosUser.email.split("@")[0],
      });
    }

    const token = generateToken(user._id.toString(), user.email);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        email_verified: user.email_verified,
        workos_id: user.workos_id,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    console.error("Auth callback error:", err);
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/signup — Email + password signup via WorkOS
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const workosUser = await workos.userManagement.createUser({
      email,
      password,
    });

    let user = await User.findOne({ workos_id: workosUser.id });
    if (!user) {
      user = await User.create({
        workos_id: workosUser.id,
        email: workosUser.email,
        email_verified: workosUser.emailVerified,
      });
      await Profile.create({
        user_id: user._id.toString(),
        username: email.split("@")[0],
      });
    }

    const token = generateToken(user._id.toString(), user.email);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        email_verified: user.email_verified,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signup failed";
    console.error("Signup error:", err);
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/signin — Email + password sign in via WorkOS
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const { user: workosUser } = await workos.userManagement.authenticateWithPassword({
      email,
      password,
      clientId: WORKOS_CLIENT_ID,
    });

    let user = await User.findOne({ workos_id: workosUser.id });
    if (!user) {
      user = await User.create({
        workos_id: workosUser.id,
        email: workosUser.email,
        email_verified: workosUser.emailVerified,
      });
    }

    const token = generateToken(user._id.toString(), user.email);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        email_verified: user.email_verified,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    console.error("Signin error:", err);
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/reset-password — Request password reset
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // WorkOS handles password reset emails
    await workos.userManagement.sendPasswordResetEmail({
      email,
    });

    res.json({ success: true });
  } catch (err: unknown) {
    // Don't reveal if email exists
    res.json({ success: true });
  }
});

// POST /api/auth/update-password — Update password (authenticated)
router.post("/update-password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await workos.userManagement.updateUser(user.workos_id, { password });
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Password update failed";
    res.status(500).json({ error: message });
  }
});

// GET /api/auth/me — Get current user
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const profile = await Profile.findOne({ user_id: req.userId });
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        email_verified: user.email_verified,
      },
      profile: profile ? profile.toObject() : null,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// POST /api/auth/signout — Sign out (client-side token removal)
router.post("/signout", (_req: Request, res: Response) => {
  // JWT is stateless — client removes the token
  res.json({ success: true });
});

export default router;
