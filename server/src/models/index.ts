export { User, type IUser } from "./User.js";
export { Profile, type IProfile } from "./Profile.js";
export { Listing, type IListing, type ListingCategory, type ListingStatus, type CompletenessBadge, type PricingType } from "./Listing.js";

import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

// ── Activity Log ──
const ActivityLogSchema = new Schema({
  user_id: { type: String, default: null, index: true },
  event_type: { type: String, required: true },
  event_data: { type: Schema.Types.Mixed, default: null },
  page: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

// ── Agent API Keys ──
const AgentApiKeySchema = new Schema({
  user_id: { type: String, required: true, index: true },
  name: { type: String, default: "default" },
  key_hash: { type: String, required: true },
  key_prefix: { type: String, required: true },
  scopes: [{ type: String }],
  last_used_at: { type: Date, default: null },
  revoked_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const AgentApiKey = mongoose.model("AgentApiKey", AgentApiKeySchema);

// ── Agent Demand Signals ──
const AgentDemandSignalSchema = new Schema({
  agent_id: { type: String, default: null },
  query: { type: String, required: true },
  source: { type: String, default: "api" },
  category: { type: String, default: null },
  tech_stack: [{ type: String }],
  max_price: { type: Number, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const AgentDemandSignal = mongoose.model("AgentDemandSignal", AgentDemandSignalSchema);

// ── Agent Listing Views ──
const AgentListingViewSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  agent_id: { type: String, default: null },
  action: { type: String, default: "view" },
  source: { type: String, default: "api" },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const AgentListingView = mongoose.model("AgentListingView", AgentListingViewSchema);

// ── Agent Webhooks ──
const AgentWebhookSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: [{ type: String }],
  active: { type: Boolean, default: true },
  filters: { type: Schema.Types.Mixed, default: {} },
  failure_count: { type: Number, default: 0 },
  last_triggered_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const AgentWebhook = mongoose.model("AgentWebhook", AgentWebhookSchema);

// ── Analyzed URLs ──
const AnalyzedUrlSchema = new Schema({
  url: { type: String, required: true },
  user_id: { type: String, default: null, index: true },
  business_name: { type: String, default: null },
  industry: { type: String, default: null },
  summary: { type: String, default: null },
  insights: { type: Schema.Types.Mixed, default: {} },
  recommended_builds: { type: Schema.Types.Mixed, default: {} },
  is_fallback: { type: Boolean, default: false },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const AnalyzedUrl = mongoose.model("AnalyzedUrl", AnalyzedUrlSchema);

// ── Blog Posts ──
const BlogPostSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: "general" },
  read_time: { type: String, default: "5 min" },
  published: { type: Boolean, default: false },
  keywords: [{ type: String }],
  generated_by: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const BlogPost = mongoose.model("BlogPost", BlogPostSchema);

// ── Bounties ──
const BountySchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  category: { type: String, enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"], default: "other" },
  status: { type: String, enum: ["open", "in_progress", "completed", "cancelled"], default: "open" },
  poster_id: { type: String, required: true, index: true },
  tech_stack: [{ type: String }],
  submissions_count: { type: Number, default: 0 },
  winner_id: { type: String, default: null },
  winner_listing_id: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const Bounty = mongoose.model("Bounty", BountySchema);

// ── Bounty Submissions ──
const BountySubmissionSchema = new Schema({
  bounty_id: { type: String, required: true, index: true },
  listing_id: { type: String, required: true },
  seller_id: { type: String, required: true },
  message: { type: String, default: null },
  status: { type: String, default: "pending" },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const BountySubmission = mongoose.model("BountySubmission", BountySubmissionSchema);

// ── Builder Support Plans ──
const BuilderSupportPlanSchema = new Schema({
  builder_id: { type: String, required: true, index: true },
  title: { type: String, default: "Basic Support" },
  description: { type: String, default: null },
  price: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const BuilderSupportPlan = mongoose.model("BuilderSupportPlan", BuilderSupportPlanSchema);

// ── Cloud Waitlist ──
const CloudWaitlistSchema = new Schema({
  email: { type: String, required: true },
  company_name: { type: String, default: null },
  message: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const CloudWaitlist = mongoose.model("CloudWaitlist", CloudWaitlistSchema);

// ── Conversations ──
const ConversationSchema = new Schema({
  buyer_id: { type: String, required: true, index: true },
  seller_id: { type: String, required: true, index: true },
  listing_id: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const Conversation = mongoose.model("Conversation", ConversationSchema);

// ── Credit Balances ──
const CreditBalanceSchema = new Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  balance: { type: Number, default: 0 },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const CreditBalance = mongoose.model("CreditBalance", CreditBalanceSchema);

// ── Credit Transactions ──
const CreditTransactionSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  description: { type: String, default: null },
  listing_id: { type: String, default: null },
  stripe_session_id: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const CreditTransaction = mongoose.model("CreditTransaction", CreditTransactionSchema);

// ── Deployed Sites ──
const DeployedSiteSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  listing_id: { type: String, required: true, index: true },
  site_id: { type: String, required: true },
  site_url: { type: String, required: true },
  provider: { type: String, default: "vercel" },
  status: { type: String, default: "active" },
  deploy_id: { type: String, default: null },
  netlify_token_hash: { type: String, default: null },
  fix_count: { type: Number, default: 0 },
  health_log: { type: Schema.Types.Mixed, default: [] },
  last_check_at: { type: Date, default: null },
  last_fix_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const DeployedSite = mongoose.model("DeployedSite", DeployedSiteSchema);

// ── Discount Codes ──
const DiscountCodeSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discount_type: { type: String, required: true },
  discount_value: { type: Number, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const DiscountCode = mongoose.model("DiscountCode", DiscountCodeSchema);

// ── Discount Code Usage ──
const DiscountCodeUsageSchema = new Schema({
  discount_code_id: { type: String, required: true, index: true },
  buyer_id: { type: String, required: true },
  used_at: { type: Date, default: Date.now },
});
export const DiscountCodeUsage = mongoose.model("DiscountCodeUsage", DiscountCodeUsageSchema);

// ── Enterprise Inquiries ──
const EnterpriseInquirySchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, default: null },
  team_size: { type: String, default: null },
  budget: { type: String, default: null },
  message: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const EnterpriseInquiry = mongoose.model("EnterpriseInquiry", EnterpriseInquirySchema);

// ── Follows ──
const FollowSchema = new Schema({
  follower_id: { type: String, required: true, index: true },
  following_id: { type: String, required: true, index: true },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
FollowSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });
export const Follow = mongoose.model("Follow", FollowSchema);

// ── Fork Requests ──
const ForkRequestSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  requester_id: { type: String, required: true },
  builder_id: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: "pending" },
  budget: { type: Number, default: null },
  builder_fee: { type: Number, default: null },
  delivered_listing_id: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const ForkRequest = mongoose.model("ForkRequest", ForkRequestSchema);

// ── Generation Jobs ──
const GenerationJobSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  status: { type: String, default: "pending" },
  stage: { type: String, default: null },
  listing_id: { type: String, default: null },
  listing_title: { type: String, default: null },
  error: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const GenerationJob = mongoose.model("GenerationJob", GenerationJobSchema);

// ── Improvement Changes ──
const ImprovementChangeSchema = new Schema({
  cycle_id: { type: String, required: true, index: true },
  file_path: { type: String, required: true },
  change_type: { type: String, default: "modify" },
  description: { type: String, required: true },
  code: { type: String, required: true },
  risk_level: { type: String, default: "low" },
  approved: { type: Boolean, default: null },
  applied_at: { type: Date, default: null },
});
export const ImprovementChange = mongoose.model("ImprovementChange", ImprovementChangeSchema);

// ── Improvement Cycles ──
const ImprovementCycleSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  trigger: { type: String, default: "manual" },
  status: { type: String, default: "pending" },
  analysis: { type: Schema.Types.Mixed, default: {} },
  suggestions: { type: Schema.Types.Mixed, default: {} },
  screenshot_url: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const ImprovementCycle = mongoose.model("ImprovementCycle", ImprovementCycleSchema);

// ── Listing Flags ──
const ListingFlagSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  reporter_id: { type: String, required: true },
  reason: { type: String, required: true },
  details: { type: String, default: null },
  status: { type: String, default: "pending" },
  reviewed_by: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const ListingFlag = mongoose.model("ListingFlag", ListingFlagSchema);

// ── Listing Verifications ──
const ListingVerificationSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  method: { type: String, default: "dns" },
  token: { type: String, default: () => crypto.randomBytes(32).toString("hex") },
  status: { type: String, default: "pending" },
  verified_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const ListingVerification = mongoose.model("ListingVerification", ListingVerificationSchema);

// ── Messages ──
const MessageSchema = new Schema({
  conversation_id: { type: String, required: true, index: true },
  sender_id: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const Message = mongoose.model("Message", MessageSchema);

// ── Notifications ──
const NotificationSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  link: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  read: { type: Boolean, default: false },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const Notification = mongoose.model("Notification", NotificationSchema);

// ── Offers ──
const OfferSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  buyer_id: { type: String, required: true },
  seller_id: { type: String, required: true },
  offer_amount: { type: Number, required: true },
  original_price: { type: Number, required: true },
  counter_amount: { type: Number, default: null },
  message: { type: String, default: null },
  seller_message: { type: String, default: null },
  status: { type: String, default: "pending" },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const Offer = mongoose.model("Offer", OfferSchema);

// ── Organizations ──
const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  domain: { type: String, default: null },
  logo_url: { type: String, default: null },
  brand_colors: { type: Schema.Types.Mixed, default: null },
  sso_config: { type: Schema.Types.Mixed, default: null },
  subscription_tier: { type: String, default: null },
  max_seats: { type: Number, default: null },
  max_apps: { type: Number, default: null },
  created_by: { type: String, required: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const Organization = mongoose.model("Organization", OrganizationSchema);

// ── Org Invitations ──
const OrgInvitationSchema = new Schema({
  org_id: { type: String, required: true, index: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["owner", "admin", "builder", "member"], default: "member" },
  invited_by: { type: String, required: true },
  token: { type: String, default: () => crypto.randomBytes(32).toString("hex") },
  status: { type: String, default: "pending" },
  expires_at: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  accepted_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const OrgInvitation = mongoose.model("OrgInvitation", OrgInvitationSchema);

// ── Org Listings ──
const OrgListingSchema = new Schema({
  org_id: { type: String, required: true, index: true },
  listing_id: { type: String, required: true, index: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  department: { type: String, default: null },
  notes: { type: String, default: null },
  compliance_tags: [{ type: String }],
  approved_by: { type: String, default: null },
  approved_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const OrgListing = mongoose.model("OrgListing", OrgListingSchema);

// ── Org Members ──
const OrgMemberSchema = new Schema({
  org_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  role: { type: String, enum: ["owner", "admin", "builder", "member"], default: "member" },
  invited_by: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
OrgMemberSchema.index({ org_id: 1, user_id: 1 }, { unique: true });
export const OrgMember = mongoose.model("OrgMember", OrgMemberSchema);

// ── Outreach Campaigns ──
const OutreachCampaignSchema = new Schema({
  name: { type: String, required: true },
  niche: { type: String, required: true },
  status: { type: String, default: "draft" },
  industries: [{ type: String }],
  target_regions: [{ type: String }],
  goals: { type: Schema.Types.Mixed, default: {} },
  services: { type: Schema.Types.Mixed, default: {} },
  created_by: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const OutreachCampaign = mongoose.model("OutreachCampaign", OutreachCampaignSchema);

// ── Outreach Leads ──
const OutreachLeadSchema = new Schema({
  campaign_id: { type: String, required: true, index: true },
  business_name: { type: String, required: true },
  industry: { type: String, required: true },
  website_url: { type: String, default: null },
  contact_name: { type: String, default: null },
  contact_email: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  country: { type: String, default: null },
  source: { type: String, default: "manual" },
  score: { type: Number, default: 0 },
  lead_status: { type: String, default: "new" },
  notes: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
  last_contacted_at: { type: Date, default: null },
  next_follow_up_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const OutreachLead = mongoose.model("OutreachLead", OutreachLeadSchema);

// ── Outreach Messages ──
const OutreachMessageSchema = new Schema({
  campaign_id: { type: String, required: true, index: true },
  lead_id: { type: String, required: true, index: true },
  channel: { type: String, default: "email" },
  direction: { type: String, default: "outbound" },
  subject: { type: String, default: null },
  body: { type: String, required: true },
  message_status: { type: String, default: "draft" },
  ai_generated: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, default: {} },
  sent_at: { type: Date, default: null },
  replied_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const OutreachMessage = mongoose.model("OutreachMessage", OutreachMessageSchema);

// ── Project Goals ──
const ProjectGoalSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  goals_prompt: { type: String, required: true },
  structured_goals: { type: Schema.Types.Mixed, default: {} },
  auto_improve: { type: Boolean, default: false },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const ProjectGoal = mongoose.model("ProjectGoal", ProjectGoalSchema);

// ── Purchases ──
const PurchaseSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  buyer_id: { type: String, required: true, index: true },
  seller_id: { type: String, required: true, index: true },
  amount_paid: { type: Number, required: true },
  platform_fee: { type: Number, required: true },
  seller_amount: { type: Number, required: true },
  payout_transferred: { type: Boolean, default: false },
  stripe_session_id: { type: String, default: null },
  stripe_payment_intent_id: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
// A buyer can own a given listing at most once. Enforced at the DB
// layer so concurrent claim requests can't race past the application-
// level duplicate-check.
PurchaseSchema.index({ listing_id: 1, buyer_id: 1 }, { unique: true });
export const Purchase = mongoose.model("Purchase", PurchaseSchema);

// ── Remix Chains ──
const RemixChainSchema = new Schema({
  parent_listing_id: { type: String, required: true, index: true },
  child_listing_id: { type: String, required: true, unique: true },
  remixer_id: { type: String, required: true },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const RemixChain = mongoose.model("RemixChain", RemixChainSchema);

// ── Reviews ──
const ReviewSchema = new Schema({
  listing_id: { type: String, required: true, index: true },
  purchase_id: { type: String, required: true, unique: true },
  buyer_id: { type: String, required: true },
  rating: { type: Number, required: true },
  review_text: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const Review = mongoose.model("Review", ReviewSchema);

// ── Saved Ideas ──
const SavedIdeaSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "general" },
  priority: { type: String, default: "medium" },
  search_query: { type: String, required: true },
  source_url: { type: String, default: null },
  notes: { type: String, default: null },
  status: { type: String, default: "saved" },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const SavedIdea = mongoose.model("SavedIdea", SavedIdeaSchema);

// ── Security Audit Log ──
const SecurityAuditLogSchema = new Schema({
  action: { type: String, required: true },
  resource_type: { type: String, required: true },
  resource_id: { type: String, default: null },
  actor_id: { type: String, default: null },
  ip_address: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const SecurityAuditLog = mongoose.model("SecurityAuditLog", SecurityAuditLogSchema);

// ── Subscriptions ──
const SubscriptionSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  plan: { type: String, default: "free" },
  status: { type: String, default: "active" },
  stripe_customer_id: { type: String, default: null },
  stripe_subscription_id: { type: String, default: null },
  current_period_start: { type: Date, default: null },
  current_period_end: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
export const Subscription = mongoose.model("Subscription", SubscriptionSchema);

// ── Swarm Tasks ──
const SwarmTaskSchema = new Schema({
  agent_type: { type: String, required: true },
  action: { type: String, required: true },
  status: { type: String, default: "pending" },
  triggered_by: { type: String, default: "system" },
  input: { type: Schema.Types.Mixed, default: {} },
  output: { type: Schema.Types.Mixed, default: null },
  error: { type: String, default: null },
  completed_at: { type: Date, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const SwarmTask = mongoose.model("SwarmTask", SwarmTaskSchema);

// ── User Roles ──
const UserRoleSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  role: { type: String, enum: ["admin", "moderator", "user"], required: true },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
UserRoleSchema.index({ user_id: 1, role: 1 }, { unique: true });
export const UserRole = mongoose.model("UserRole", UserRoleSchema);

// ── Webhook Events ──
const WebhookEventSchema = new Schema({
  stripe_event_id: { type: String, required: true, unique: true },
  event_type: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  processing_status: { type: String, default: "pending" },
  processed_at: { type: Date, default: null },
  error_message: { type: String, default: null },
}, { timestamps: { createdAt: "created_at", updatedAt: false } });
export const WebhookEvent = mongoose.model("WebhookEvent", WebhookEventSchema);
