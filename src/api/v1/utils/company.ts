import { Types } from "mongoose";

export interface ICompany {
    id:string;
  name: string;
  industryType: string;
  size: string;
  country: string;
  address: string;
  city: string;
  postalcode: string;
  admin: Types.ObjectId; // Reference to the Company Admin (User)
  consultants: Types.ObjectId[]; // Array of references to Consultants (User)
  clients: Types.ObjectId[]; // Array of references to Clients (User)
  isActive: boolean; // To track if the company is active
}

export interface CompanySignupData{
    name:string;
    industryType:string;
    size: string;
  country: string;
  address: string;
  city: string;
  postalcode?: string;
}