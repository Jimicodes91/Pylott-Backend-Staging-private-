import mongoose from "mongoose";
import { IUser, UserRole } from "../utils/user";

const userSchema = new mongoose.Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true
  },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
     
    },
    pfp:{
      type:String
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],

    },
    name: {
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
    timezone:{
      type:String,
    },
    language:{
      type:String,
      
    },
    currency:{
      type:String
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
