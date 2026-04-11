import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  workos_id: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    workos_id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    email_verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const User = mongoose.model<IUser>("User", UserSchema);
