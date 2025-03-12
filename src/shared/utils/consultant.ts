import { Types } from "mongoose";

export interface IConsultant {
  user: Types.ObjectId; // Reference to the User model
  company: Types.ObjectId; // Reference to the Company model
  skills: string[]; // Array of skills (e.g., ["UI/UX Design", "Project Management"])
  hourlyRate?: number; // Optional: Hourly rate for the consultant
  isActive: boolean; // To track if the consultant is active
}