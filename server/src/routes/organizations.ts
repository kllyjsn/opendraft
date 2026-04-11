import { Router, Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { Organization, OrgMember, OrgInvitation, OrgListing, Profile } from "../models/index.js";

const router = Router();

// GET /api/organizations/:slug — Get org by slug
router.get("/:slug", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const members = await OrgMember.find({ org_id: org._id.toString() });
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const profile = await Profile.findOne({ user_id: m.user_id });
        return { ...m.toObject(), profile };
      })
    );

    const currentMember = members.find((m) => m.user_id === req.userId);

    res.json({ data: org, members: enrichedMembers, currentMember: currentMember || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch organization" });
  }
});

// POST /api/organizations — Create org
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const org = await Organization.create({ ...req.body, created_by: req.userId });
    await OrgMember.create({ org_id: org._id.toString(), user_id: req.userId!, role: "owner" });
    res.status(201).json({ data: org });
  } catch (err) {
    res.status(500).json({ error: "Failed to create organization" });
  }
});

// PATCH /api/organizations/:id — Update org
router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await OrgMember.findOne({ org_id: req.params.id, user_id: req.userId });
    if (!member || !["owner", "admin"].includes(member.role)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    const updated = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update organization" });
  }
});

// POST /api/organizations/:id/invite — Invite member
router.post("/:id/invite", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await OrgMember.findOne({ org_id: req.params.id, user_id: req.userId });
    if (!member || !["owner", "admin"].includes(member.role)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const invitation = await OrgInvitation.create({
      org_id: req.params.id,
      email: req.body.email,
      role: req.body.role || "member",
      invited_by: req.userId!,
    });

    res.status(201).json({ data: invitation });
  } catch (err) {
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// POST /api/organizations/accept-invitation — Accept an invitation
router.post("/accept-invitation", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invitation_id } = req.body;
    const invitation = await OrgInvitation.findById(invitation_id);
    if (!invitation || invitation.status !== "pending") {
      res.status(404).json({ error: "Invitation not found or already used" });
      return;
    }

    // Add user to org
    await OrgMember.create({
      org_id: invitation.org_id,
      user_id: req.userId!,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

    // Mark invitation as accepted
    invitation.status = "accepted";
    invitation.accepted_at = new Date();
    await invitation.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// DELETE /api/organizations/:orgId/members/:userId — Remove member
router.delete("/:orgId/members/:userId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await OrgMember.findOne({ org_id: req.params.orgId, user_id: req.userId });
    if (!member || !["owner", "admin"].includes(member.role)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    await OrgMember.deleteOne({ org_id: req.params.orgId, user_id: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// GET /api/organizations/:id/listings — Get org listings
router.get("/:id/listings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgListings = await OrgListing.find({ org_id: req.params.id });
    res.json({ data: orgListings });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch org listings" });
  }
});

// POST /api/organizations/:id/listings — Add listing to org
router.post("/:id/listings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await OrgMember.findOne({ org_id: req.params.id, user_id: req.userId });
    if (!member) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    const orgListing = await OrgListing.create({ org_id: req.params.id, ...req.body });
    res.status(201).json({ data: orgListing });
  } catch (err) {
    res.status(500).json({ error: "Failed to add listing to org" });
  }
});

// GET /api/organizations/:id/invitations — List invitations
router.get("/:id/invitations", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invitations = await OrgInvitation.find({ org_id: req.params.id }).sort({ created_at: -1 });
    res.json({ data: invitations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

export default router;
