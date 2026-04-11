import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  total_sales: number;
  followers_count: number;
  following_count: number;
  verified: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    avatar_url: { type: String, default: null },
    bio: { type: String, default: null },
    stripe_account_id: { type: String, default: null },
    stripe_onboarded: { type: Boolean, default: false },
    total_sales: { type: Number, default: 0 },
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);
