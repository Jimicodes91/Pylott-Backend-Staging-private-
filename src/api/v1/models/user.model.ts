import mongoose from "mongoose";
import { IUser, UserRole } from "../utils/user";

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
     
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],

    },
    firstname: {
      type: String,
    
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
    },
    company: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Company",
        default: null, 
      },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    verificationToken:{
        type:String,
    },
    tokenExpires:{
        type:Number
    },
    passwordSetupToken:{
        type:String
    },
    passwordSetupTokenExpires:{
        type:Number
    }


  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
