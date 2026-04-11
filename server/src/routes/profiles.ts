import { Router, Response } from "express";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { Profile, Listing, Follow } from "../models/index.js";

const router = Router();

// GET /api/profiles/me — Get current user's profile
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await Profile.findOne({ user_id: req.userId });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json({ data: profile });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// GET /api/profiles/:username — Get profile by username
router.get("/:username", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    // Get seller listings
    const listings = await Listing.find({ seller_id: profile.user_id, status: "live" })
      .sort({ created_at: -1 });

    // Check if current user follows this profile
    let isFollowing = false;
    if (req.userId) {
      const follow = await Follow.findOne({ follower_id: req.userId, following_id: profile.user_id });
      isFollowing = !!follow;
    }

    res.json({ data: profile, listings, isFollowing });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/profiles/me — Update current user's profile
router.patch("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowedFields = ['username', 'avatar_url', 'bio', 'website', 'twitter_handle', 'github_handle', 'display_name', 'tagline'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in req.body) updates[key] = req.body[key];
    }
    const profile = await Profile.findOneAndUpdate(
      { user_id: req.userId },
      updates,
      { new: true }
    );
    res.json({ data: profile });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
