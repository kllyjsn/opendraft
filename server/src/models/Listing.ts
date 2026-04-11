import mongoose, { Schema, Document } from "mongoose";

export type ListingCategory = "saas_tool" | "ai_app" | "landing_page" | "utility" | "game" | "other";
export type ListingStatus = "pending" | "live" | "hidden";
export type CompletenessBadge = "prototype" | "mvp" | "production_ready";
export type PricingType = "one_time" | "monthly";

export interface IListing extends Document {
  title: string;
  description: string;
  price: number;
  pricing_type: PricingType;
  category: ListingCategory;
  completeness_badge: CompletenessBadge;
  status: ListingStatus;
  seller_id: string;
  file_path: string | null;
  demo_url: string | null;
  github_url: string | null;
  screenshots: string[];
  tech_stack: string[];
  built_with: string | null;
  compliance_tags: string[];
  agent_ready: boolean;
  domain_verified: boolean;
  staff_pick: boolean;
  staff_pick_category: string | null;
  security_score: number | null;
  view_count: number;
  sales_count: number;
  remix_count: number;
  remixed_from: string | null;
  created_at: Date;
  updated_at: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    pricing_type: { type: String, enum: ["one_time", "monthly"], default: "one_time" },
    category: { type: String, enum: ["saas_tool", "ai_app", "landing_page", "utility", "game", "other"], default: "other" },
    completeness_badge: { type: String, enum: ["prototype", "mvp", "production_ready"], default: "prototype" },
    status: { type: String, enum: ["pending", "live", "hidden"], default: "pending" },
    seller_id: { type: String, required: true, index: true },
    file_path: { type: String, default: null },
    demo_url: { type: String, default: null },
    github_url: { type: String, default: null },
    screenshots: [{ type: String }],
    tech_stack: [{ type: String }],
    built_with: { type: String, default: null },
    compliance_tags: [{ type: String }],
    agent_ready: { type: Boolean, default: false },
    domain_verified: { type: Boolean, default: false },
    staff_pick: { type: Boolean, default: false },
    staff_pick_category: { type: String, default: null },
    security_score: { type: Number, default: null },
    view_count: { type: Number, default: 0 },
    sales_count: { type: Number, default: 0 },
    remix_count: { type: Number, default: 0 },
    remixed_from: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ListingSchema.index({ title: "text", description: "text" });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ staff_pick: 1 });

export const Listing = mongoose.model<IListing>("Listing", ListingSchema);
