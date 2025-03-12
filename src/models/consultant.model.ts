import mongoose from "mongoose";
import { IConsultant } from "../utils/consultant";

const consultantSchema = new mongoose.Schema<IConsultant>(
  {
    // id: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    hourlyRate: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Consultant = mongoose.model<IConsultant>("Consultant", consultantSchema);
export default Consultant;