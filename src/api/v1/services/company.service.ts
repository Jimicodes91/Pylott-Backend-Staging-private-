import Company from "../models/company.model";
import { v4 as uuidv4 } from 'uuid'
import { CompanySignupData } from "../utils/company";
import HttpError from "../utils/errorHandler";
import User from "../models/user.model";
import crypto from "crypto";
import sendEmail from "../utils/nodemailer";
import { UserRole } from "../utils/user";

export const createCompanyService = async (data: CompanySignupData, adminId:string) => {
  const companyData = {
    id:uuidv4(),
    admin:adminId,
    ...data,
  };
  try {
    const newCompany = await Company.create(companyData);

    // Step 2: Update the admin's company field
    //await User.findByIdAndUpdate(adminId, { company: newCompany._id });
    return newCompany;
  } catch (error: any) {
    console.error("Error creating form:", error);
    throw new HttpError(
      error.message || "Server error, please try again later",
      error.statusCode || 500
    );
  }
};

