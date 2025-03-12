import { Types } from "mongoose";

export interface IClient {
  user: Types.ObjectId; // Reference to the User model
  company: Types.ObjectId; // Reference to the Company model
  projects: Types.ObjectId[]; // Array of references to projects
  contactPerson?: string; // Optional: Name of the contact person
  billingAddress?: string; // Optional: Billing address for the client
  isActive: boolean; // To track if the client is active
}