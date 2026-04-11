import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  Follow, Purchase, Subscription, CreditBalance, CreditTransaction,
  UserRole, Notification, SavedIdea, GenerationJob, DeployedSite,
  Bounty, BountySubmission, Review, Offer, BlogPost, ActivityLog,
  ListingFlag, ListingVerification, AgentApiKey, AgentWebhook,
  AgentDemandSignal, AgentListingView, ImprovementCycle, ImprovementChange,
  ProjectGoal, ForkRequest, BuilderSupportPlan, AnalyzedUrl,
  CloudWaitlist, EnterpriseInquiry, DiscountCode, DiscountCodeUsage,
  SecurityAuditLog, SwarmTask, WebhookEvent, OutreachCampaign,
  OutreachLead, OutreachMessage, Profile, Listing
} from "../models/index.js";

const router = Router();

// ── Follows ──
router.get("/follows/check", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { following_id } = req.query;
    const follow = await Follow.findOne({ follower_id: req.userId, following_id });
    res.json({ isFollowing: !!follow });
  } catch (err) { res.status(500).json({ error: "Failed to check follow" }); }
});

router.get("/follows/count/:userId", async (req: Request, res: Response) => {
  try {
    const followers = await Follow.countDocuments({ following_id: req.params.userId });
    const following = await Follow.countDocuments({ follower_id: req.params.userId });
    res.json({ followers, following });
  } catch (err) { res.status(500).json({ error: "Failed to count follows" }); }
});

router.post("/follows", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { following_id } = req.body;
    await Follow.create({ follower_id: req.userId, following_id });
    await Profile.updateOne({ user_id: following_id }, { $inc: { followers_count: 1 } });
    await Profile.updateOne({ user_id: req.userId }, { $inc: { following_count: 1 } });
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to follow" }); }
});

router.delete("/follows/:followingId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Follow.deleteOne({ follower_id: req.userId, following_id: req.params.followingId });
    await Profile.updateOne({ user_id: req.params.followingId }, { $inc: { followers_count: -1 } });
    await Profile.updateOne({ user_id: req.userId }, { $inc: { following_count: -1 } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to unfollow" }); }
});

// ── Subscriptions ──
router.get("/subscriptions/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sub = await Subscription.findOne({ user_id: req.userId, status: "active" });
    res.json({ data: sub });
  } catch (err) { res.status(500).json({ error: "Failed to fetch subscription" }); }
});

// ── Credits ──
router.get("/credits/balance", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const balance = await CreditBalance.findOne({ user_id: req.userId });
    res.json({ balance: balance?.balance ?? 0 });
  } catch (err) { res.status(500).json({ error: "Failed to fetch balance" }); }
});

router.get("/credits/transactions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = await CreditTransaction.find({ user_id: req.userId })
      .sort({ created_at: -1 }).limit(50);
    res.json({ data: transactions });
  } catch (err) { res.status(500).json({ error: "Failed to fetch transactions" }); }
});

// ── Purchases ──
router.get("/purchases/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const purchases = await Purchase.find({ buyer_id: req.userId }).sort({ created_at: -1 });
    res.json({ data: purchases });
  } catch (err) { res.status(500).json({ error: "Failed to fetch purchases" }); }
});

router.get("/purchases/check/:listingId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const purchase = await Purchase.findOne({ listing_id: req.params.listingId, buyer_id: req.userId });
    res.json({ hasPurchased: !!purchase });
  } catch (err) { res.status(500).json({ error: "Failed to check purchase" }); }
});

router.get("/purchases/sales", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sales = await Purchase.find({ seller_id: req.userId })
      .sort({ created_at: -1 }).limit(50);
    // Enrich with listing titles
    const enriched = await Promise.all(sales.map(async (s) => {
      const listing = await Listing.findById(s.listing_id);
      return { ...s.toObject(), listing_title: listing?.title };
    }));
    res.json({ data: enriched });
  } catch (err) { res.status(500).json({ error: "Failed to fetch sales" }); }
});

router.get("/purchases/count", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await Purchase.countDocuments({ buyer_id: req.userId });
    res.json({ count });
  } catch (err) { res.status(500).json({ error: "Failed to count purchases" }); }
});

// ── User Roles ──
router.get("/user-roles/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = await UserRole.find({ user_id: req.userId });
    res.json({ data: roles, isAdmin: roles.some((r) => r.role === "admin") });
  } catch (err) { res.status(500).json({ error: "Failed to fetch roles" }); }
});

// ── Notifications ──
router.get("/notifications", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user_id: req.userId })
      .sort({ created_at: -1 }).limit(50);
    res.json({ data: notifications });
  } catch (err) { res.status(500).json({ error: "Failed to fetch notifications" }); }
});

router.patch("/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to mark notification as read" }); }
});

router.post("/notifications/read-all", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany({ user_id: req.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to mark all as read" }); }
});

// ── Saved Ideas ──
router.get("/saved-ideas", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ideas = await SavedIdea.find({ user_id: req.userId }).sort({ created_at: -1 });
    res.json({ data: ideas });
  } catch (err) { res.status(500).json({ error: "Failed to fetch saved ideas" }); }
});

router.post("/saved-ideas", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idea = await SavedIdea.create({ ...req.body, user_id: req.userId });
    res.status(201).json({ data: idea });
  } catch (err) { res.status(500).json({ error: "Failed to save idea" }); }
});

router.delete("/saved-ideas/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await SavedIdea.deleteOne({ _id: req.params.id, user_id: req.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete idea" }); }
});

router.patch("/saved-ideas/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idea = await SavedIdea.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId }, req.body, { new: true });
    res.json({ data: idea });
  } catch (err) { res.status(500).json({ error: "Failed to update idea" }); }
});

// ── Generation Jobs ──
router.get("/generation-jobs/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await GenerationJob.findById(req.params.id);
    if (!job || job.user_id !== req.userId) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json({ data: job });
  } catch (err) { res.status(500).json({ error: "Failed to fetch job" }); }
});

router.post("/generation-jobs", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await GenerationJob.create({ ...req.body, user_id: req.userId });
    res.status(201).json({ data: job });
  } catch (err) { res.status(500).json({ error: "Failed to create job" }); }
});

// ── Deployed Sites ──
router.get("/deployed-sites", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sites = await DeployedSite.find({ user_id: req.userId }).sort({ created_at: -1 });
    res.json({ data: sites });
  } catch (err) { res.status(500).json({ error: "Failed to fetch deployed sites" }); }
});

router.get("/deployed-sites/listing/:listingId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const site = await DeployedSite.findOne({ listing_id: req.params.listingId, user_id: req.userId });
    res.json({ data: site });
  } catch (err) { res.status(500).json({ error: "Failed to fetch deployed site" }); }
});

// ── Bounties ──
router.get("/bounties", async (_req: Request, res: Response) => {
  try {
    const bounties = await Bounty.find({ status: { $ne: "cancelled" } }).sort({ created_at: -1 });
    res.json({ data: bounties });
  } catch (err) { res.status(500).json({ error: "Failed to fetch bounties" }); }
});

router.post("/bounties", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bounty = await Bounty.create({ ...req.body, poster_id: req.userId });
    res.status(201).json({ data: bounty });
  } catch (err) { res.status(500).json({ error: "Failed to create bounty" }); }
});

router.get("/bounties/:id", async (req: Request, res: Response) => {
  try {
    const bounty = await Bounty.findById(req.params.id);
    if (!bounty) { res.status(404).json({ error: "Bounty not found" }); return; }
    const submissions = await BountySubmission.find({ bounty_id: req.params.id });
    res.json({ data: bounty, submissions });
  } catch (err) { res.status(500).json({ error: "Failed to fetch bounty" }); }
});

router.post("/bounties/:id/submissions", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const submission = await BountySubmission.create({
      bounty_id: req.params.id, seller_id: req.userId, ...req.body,
    });
    await Bounty.updateOne({ _id: req.params.id }, { $inc: { submissions_count: 1 } });
    res.status(201).json({ data: submission });
  } catch (err) { res.status(500).json({ error: "Failed to submit" }); }
});

// ── Reviews ──
router.get("/reviews/listing/:listingId", async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ listing_id: req.params.listingId }).sort({ created_at: -1 });
    res.json({ data: reviews });
  } catch (err) { res.status(500).json({ error: "Failed to fetch reviews" }); }
});

router.post("/reviews", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const review = await Review.create({ ...req.body, buyer_id: req.userId });
    res.status(201).json({ data: review });
  } catch (err) { res.status(500).json({ error: "Failed to create review" }); }
});

// ── Offers ──
router.get("/offers/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const offers = await Offer.find({
      $or: [{ buyer_id: req.userId }, { seller_id: req.userId }],
    }).sort({ created_at: -1 });
    res.json({ data: offers });
  } catch (err) { res.status(500).json({ error: "Failed to fetch offers" }); }
});

router.post("/offers", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const offer = await Offer.create({ ...req.body, buyer_id: req.userId });
    res.status(201).json({ data: offer });
  } catch (err) { res.status(500).json({ error: "Failed to create offer" }); }
});

router.patch("/offers/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || (offer.seller_id !== req.userId && offer.buyer_id !== req.userId)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    const updated = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: "Failed to update offer" }); }
});

// ── Blog ──
router.get("/blog", async (_req: Request, res: Response) => {
  try {
    const posts = await BlogPost.find({ published: true }).sort({ created_at: -1 });
    res.json({ data: posts });
  } catch (err) { res.status(500).json({ error: "Failed to fetch blog posts" }); }
});

router.get("/blog/:slug", async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ data: post });
  } catch (err) { res.status(500).json({ error: "Failed to fetch blog post" }); }
});

// ── Activity Log ──
router.post("/activity-log", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ActivityLog.create({ ...req.body, user_id: req.userId || null });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to log activity" }); }
});

// ── Listing Flags ──
router.post("/listing-flags", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flag = await ListingFlag.create({ ...req.body, reporter_id: req.userId });
    res.status(201).json({ data: flag });
  } catch (err) { res.status(500).json({ error: "Failed to flag listing" }); }
});

// ── Listing Verifications ──
router.get("/listing-verifications/:listingId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const verification = await ListingVerification.findOne({ listing_id: req.params.listingId });
    res.json({ data: verification });
  } catch (err) { res.status(500).json({ error: "Failed to fetch verification" }); }
});

router.post("/listing-verifications", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const verification = await ListingVerification.create(req.body);
    res.status(201).json({ data: verification });
  } catch (err) { res.status(500).json({ error: "Failed to create verification" }); }
});

// ── Agent API Keys ──
router.get("/agent-api-keys", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const keys = await AgentApiKey.find({ user_id: req.userId, revoked_at: null });
    res.json({ data: keys });
  } catch (err) { res.status(500).json({ error: "Failed to fetch API keys" }); }
});

router.post("/agent-api-keys", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const key = await AgentApiKey.create({ ...req.body, user_id: req.userId });
    res.status(201).json({ data: key });
  } catch (err) { res.status(500).json({ error: "Failed to create API key" }); }
});

router.delete("/agent-api-keys/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await AgentApiKey.updateOne(
      { _id: req.params.id, user_id: req.userId },
      { revoked_at: new Date() }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to revoke API key" }); }
});

// ── Agent Webhooks ──
router.get("/agent-webhooks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const webhooks = await AgentWebhook.find({ user_id: req.userId });
    res.json({ data: webhooks });
  } catch (err) { res.status(500).json({ error: "Failed to fetch webhooks" }); }
});

router.post("/agent-webhooks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const webhook = await AgentWebhook.create({ ...req.body, user_id: req.userId });
    res.status(201).json({ data: webhook });
  } catch (err) { res.status(500).json({ error: "Failed to create webhook" }); }
});

router.patch("/agent-webhooks/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const webhook = await AgentWebhook.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId }, req.body, { new: true });
    res.json({ data: webhook });
  } catch (err) { res.status(500).json({ error: "Failed to update webhook" }); }
});

router.delete("/agent-webhooks/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await AgentWebhook.deleteOne({ _id: req.params.id, user_id: req.userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete webhook" }); }
});

// ── Agent Demand Signals ──
router.post("/agent-demand-signals", async (req: Request, res: Response) => {
  try {
    const signal = await AgentDemandSignal.create(req.body);
    res.status(201).json({ data: signal });
  } catch (err) { res.status(500).json({ error: "Failed to create signal" }); }
});

// ── Agent Listing Views ──
router.post("/agent-listing-views", async (req: Request, res: Response) => {
  try {
    const view = await AgentListingView.create(req.body);
    res.status(201).json({ data: view });
  } catch (err) { res.status(500).json({ error: "Failed to log view" }); }
});

// ── Improvement Cycles ──
router.get("/improvement-cycles/listing/:listingId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cycles = await ImprovementCycle.find({ listing_id: req.params.listingId })
      .sort({ created_at: -1 });
    res.json({ data: cycles });
  } catch (err) { res.status(500).json({ error: "Failed to fetch improvement cycles" }); }
});

router.get("/improvement-cycles/:id/changes", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const changes = await ImprovementChange.find({ cycle_id: req.params.id });
    res.json({ data: changes });
  } catch (err) { res.status(500).json({ error: "Failed to fetch changes" }); }
});

// ── Project Goals ──
router.get("/project-goals/listing/:listingId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goal = await ProjectGoal.findOne({ listing_id: req.params.listingId, user_id: req.userId });
    res.json({ data: goal });
  } catch (err) { res.status(500).json({ error: "Failed to fetch project goal" }); }
});

router.post("/project-goals", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goal = await ProjectGoal.create({ ...req.body, user_id: req.userId });
    res.status(201).json({ data: goal });
  } catch (err) { res.status(500).json({ error: "Failed to create project goal" }); }
});

// ── Fork Requests ──
router.get("/fork-requests/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await ForkRequest.find({
      $or: [{ requester_id: req.userId }, { builder_id: req.userId }],
    }).sort({ created_at: -1 });
    res.json({ data: requests });
  } catch (err) { res.status(500).json({ error: "Failed to fetch fork requests" }); }
});

router.post("/fork-requests", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await ForkRequest.create({ ...req.body, requester_id: req.userId });
    res.status(201).json({ data: request });
  } catch (err) { res.status(500).json({ error: "Failed to create fork request" }); }
});

// ── Builder Support Plans ──
router.get("/builder-support-plans/:builderId", async (req: Request, res: Response) => {
  try {
    const plans = await BuilderSupportPlan.find({ builder_id: req.params.builderId, active: true });
    res.json({ data: plans });
  } catch (err) { res.status(500).json({ error: "Failed to fetch support plans" }); }
});

// ── Analyzed URLs ──
router.get("/analyzed-urls", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const urls = await AnalyzedUrl.find({ user_id: req.userId }).sort({ created_at: -1 });
    res.json({ data: urls });
  } catch (err) { res.status(500).json({ error: "Failed to fetch analyzed URLs" }); }
});

router.post("/analyzed-urls", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const url = await AnalyzedUrl.create({ ...req.body, user_id: req.userId });
    res.status(201).json({ data: url });
  } catch (err) { res.status(500).json({ error: "Failed to save analyzed URL" }); }
});

// ── Cloud Waitlist ──
router.post("/cloud-waitlist", async (req: Request, res: Response) => {
  try {
    const entry = await CloudWaitlist.create(req.body);
    res.status(201).json({ data: entry });
  } catch (err) { res.status(500).json({ error: "Failed to join waitlist" }); }
});

// ── Enterprise Inquiries ──
router.post("/enterprise-inquiries", async (req: Request, res: Response) => {
  try {
    const inquiry = await EnterpriseInquiry.create(req.body);
    res.status(201).json({ data: inquiry });
  } catch (err) { res.status(500).json({ error: "Failed to submit inquiry" }); }
});

// ── Discount Codes ──
router.post("/discount-codes/validate", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const discount = await DiscountCode.findOne({ code, active: true });
    if (!discount) { res.status(404).json({ error: "Invalid discount code" }); return; }
    res.json({ data: discount });
  } catch (err) { res.status(500).json({ error: "Failed to validate code" }); }
});

// ── Swarm Tasks (Admin) ──
router.get("/swarm-tasks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = await UserRole.findOne({ user_id: req.userId, role: "admin" });
    if (!role) { res.status(403).json({ error: "Admin access required" }); return; }
    const tasks = await SwarmTask.find().sort({ created_at: -1 }).limit(100);
    res.json({ data: tasks });
  } catch (err) { res.status(500).json({ error: "Failed to fetch swarm tasks" }); }
});

// ── Outreach ──
router.get("/outreach/campaigns", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaigns = await OutreachCampaign.find({ created_by: req.userId }).sort({ created_at: -1 });
    res.json({ data: campaigns });
  } catch (err) { res.status(500).json({ error: "Failed to fetch campaigns" }); }
});

router.post("/outreach/campaigns", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await OutreachCampaign.create({ ...req.body, created_by: req.userId });
    res.status(201).json({ data: campaign });
  } catch (err) { res.status(500).json({ error: "Failed to create campaign" }); }
});

router.get("/outreach/campaigns/:id/leads", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leads = await OutreachLead.find({ campaign_id: req.params.id }).sort({ created_at: -1 });
    res.json({ data: leads });
  } catch (err) { res.status(500).json({ error: "Failed to fetch leads" }); }
});

router.get("/outreach/campaigns/:id/messages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messages = await OutreachMessage.find({ campaign_id: req.params.id }).sort({ created_at: -1 });
    res.json({ data: messages });
  } catch (err) { res.status(500).json({ error: "Failed to fetch outreach messages" }); }
});

// ── Security Audit Log (Admin) ──
router.get("/security-audit-log", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = await UserRole.findOne({ user_id: req.userId, role: "admin" });
    if (!role) { res.status(403).json({ error: "Admin access required" }); return; }
    const logs = await SecurityAuditLog.find().sort({ created_at: -1 }).limit(100);
    res.json({ data: logs });
  } catch (err) { res.status(500).json({ error: "Failed to fetch audit logs" }); }
});

// ── Webhook Events (Admin) ──
router.get("/webhook-events", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = await UserRole.findOne({ user_id: req.userId, role: "admin" });
    if (!role) { res.status(403).json({ error: "Admin access required" }); return; }
    const events = await WebhookEvent.find().sort({ created_at: -1 }).limit(100);
    res.json({ data: events });
  } catch (err) { res.status(500).json({ error: "Failed to fetch webhook events" }); }
});

// ── Generic DB Query (mirrors Supabase query builder) ──
router.post("/db/query", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, operation, select, filters, order, limit: limitVal, single, maybeSingle, body, count } = req.body;
    const mongoose = await import("mongoose");

    // Get the model dynamically by table name
    const modelMap: Record<string, any> = {};
    for (const [name, model] of Object.entries(mongoose.default.models)) {
      // Map both PascalCase model names and snake_case table names
      modelMap[name.toLowerCase()] = model;
      // Convert PascalCase to snake_case for table name mapping
      const snakeName = name.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
      modelMap[snakeName] = model;
      // Also try plural snake_case
      modelMap[snakeName + "s"] = model;
    }

    const Model = modelMap[table] || modelMap[table.toLowerCase()];
    if (!Model) {
      res.status(400).json({ error: `Unknown table: ${table}` });
      return;
    }

    // Build MongoDB filter from Supabase-style filters
    const mongoFilter: Record<string, any> = {};
    if (filters) {
      for (const f of filters) {
        switch (f.type) {
          case "eq": mongoFilter[f.column] = f.value; break;
          case "neq": mongoFilter[f.column] = { $ne: f.value }; break;
          case "gt": mongoFilter[f.column] = { $gt: f.value }; break;
          case "gte": mongoFilter[f.column] = { $gte: f.value }; break;
          case "lt": mongoFilter[f.column] = { $lt: f.value }; break;
          case "lte": mongoFilter[f.column] = { $lte: f.value }; break;
          case "like": mongoFilter[f.column] = { $regex: f.value.replace(/%/g, ".*"), $options: "i" }; break;
          case "ilike": mongoFilter[f.column] = { $regex: f.value.replace(/%/g, ".*"), $options: "i" }; break;
          case "is": mongoFilter[f.column] = f.value === null ? null : f.value; break;
          case "in": mongoFilter[f.column] = { $in: f.values || f.value }; break;
          case "contains": mongoFilter[f.column] = { $in: Array.isArray(f.value) ? f.value : [f.value] }; break;
          case "not": {
            const notOp = f.value?.op;
            const notVal = f.value?.value;
            if (notOp === "eq") mongoFilter[f.column] = { $ne: notVal };
            else if (notOp === "in") mongoFilter[f.column] = { $nin: notVal };
            break;
          }
          case "textSearch": mongoFilter["$text"] = { $search: f.value }; break;
          case "or": {
            // Parse Supabase OR expression like "col1.eq.val1,col2.eq.val2"
            const parts = (f.value as string).split(",").map((p: string) => {
              const [col, op, ...rest] = p.trim().split(".");
              const val = rest.join(".");
              if (op === "eq") return { [col]: val };
              if (op === "neq") return { [col]: { $ne: val } };
              if (op === "is" && val === "null") return { [col]: null };
              return { [col]: val };
            });
            mongoFilter["$or"] = parts;
            break;
          }
        }
      }
    }

    if (operation === "select") {
      let query = Model.find(mongoFilter);

      // Handle select columns (basic - just include all for now)
      if (select && select !== "*") {
        const fields = select.split(",").reduce((acc: Record<string, number>, f: string) => {
          const col = f.trim().split("(")[0].trim(); // Remove function calls like count()
          if (col && !col.includes("!")) acc[col] = 1;
          return acc;
        }, {} as Record<string, number>);
        if (Object.keys(fields).length > 0) query = query.select(fields);
      }

      // Order
      if (order && order.length > 0) {
        const sortObj: Record<string, 1 | -1> = {};
        for (const o of order) {
          sortObj[o.column] = o.ascending ? 1 : -1;
        }
        query = query.sort(sortObj);
      }

      // Limit
      if (limitVal) query = query.limit(limitVal);

      // Range filter
      const rangeFilter = filters?.find((f: any) => f.type === "range");
      if (rangeFilter) {
        const { from, to } = rangeFilter.value;
        query = query.skip(from).limit(to - from + 1);
      }

      if (single || maybeSingle) {
        const doc = await Model.findOne(mongoFilter);
        if (!doc && single) {
          res.status(404).json({ data: null, error: "Not found" });
          return;
        }
        const result: any = { data: doc };
        if (count === "exact") result.count = await Model.countDocuments(mongoFilter);
        res.json(result);
      } else {
        const data = await query.exec();
        const result: any = { data };
        if (count === "exact") result.count = await Model.countDocuments(mongoFilter);
        res.json(result);
      }
    } else if (operation === "insert") {
      const doc = await Model.create(body);
      res.json({ data: Array.isArray(doc) ? doc : doc });
    } else if (operation === "update") {
      if (single || maybeSingle) {
        const doc = await Model.findOneAndUpdate(mongoFilter, { $set: body }, { new: true });
        res.json({ data: doc });
      } else {
        await Model.updateMany(mongoFilter, { $set: body });
        const updated = await Model.find(mongoFilter);
        res.json({ data: updated });
      }
    } else if (operation === "upsert") {
      const doc = await Model.findOneAndUpdate(mongoFilter, { $set: body }, { new: true, upsert: true });
      res.json({ data: doc });
    } else if (operation === "delete") {
      if (single || maybeSingle) {
        const doc = await Model.findOneAndDelete(mongoFilter);
        res.json({ data: doc });
      } else {
        await Model.deleteMany(mongoFilter);
        res.json({ data: null });
      }
    } else {
      res.status(400).json({ error: `Unknown operation: ${operation}` });
    }
  } catch (err: any) {
    console.error("DB query error:", err);
    res.status(500).json({ error: err.message || "Query failed" });
  }
});

// ── RPC proxy (for Supabase RPC functions) ──
router.post("/rpc/:functionName", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Map RPC function names to MongoDB operations
    const fnName = req.params.functionName;
    const params = req.body;

    switch (fnName) {
      case "increment_sales_count":
        await Listing.updateOne({ _id: params.listing_id_param }, { $inc: { sales_count: 1 } });
        break;
      case "increment_seller_sales":
        await Profile.updateOne({ user_id: params.seller_id_param }, { $inc: { total_sales: 1 } });
        break;
      default:
        res.status(501).json({ error: `RPC function ${fnName} not yet migrated` });
        return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "RPC call failed" });
  }
});

// ── Edge Function proxy (for functions not yet migrated) ──
router.post("/functions/:functionName", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This is a placeholder for edge functions that need to be migrated
    // Each function should eventually get its own dedicated route
    res.status(501).json({ error: `Function ${req.params.functionName} not yet migrated` });
  } catch (err) {
    res.status(500).json({ error: "Function invocation failed" });
  }
});

export default router;
