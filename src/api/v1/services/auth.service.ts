import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import HttpError from "../utils/errorHandler";
import { AdminSignupData, CompanyAdminSignpData, loginData, UserRole } from "../utils/user";
import User from "../models/user.model";
import crypto from "crypto";
import sendEmail from "../utils/nodemailer";
import jwt from "jsonwebtoken"
import { generateToken } from "../utils";
import Company from "../models/company.model";

export const AdminSignup = async (data: AdminSignupData) => {
  const { email, password } = data;
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenExpires = Date.now() + 900000; // Token valid for 15 minutes

  //const userPassword = generateRandomPassword()

  const userData = {
  
    email,
    password,
    verificationToken, // Add verificationToken to userData
    tokenExpires, // Add tokenExpires to userData
    role: UserRole.PYLOTT_ADMIN,
  };

  try {
    // Check if the email is already taken
    const user = await User.findOne({ email });
    if (user) {
      throw new HttpError("Email is taken, use a different email address", 400);
    }
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    const strongPassword = passwordRegex.test(password);
    if (!strongPassword) {
      throw new HttpError(
        "Password must be 8+ chars with uppercase, lowercase, number, and special character",
        400
      );
    }


    // // Hash the password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = bcrypt.hashSync(password, salt);
    }

    // Create the new user
    const newUser = await User.create(userData);

    // Remove the password from the returned user object
    if (newUser.password) {
      newUser.password = "";
    }

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(
      email
    )}`;

    await sendEmail(
      newUser.email,
      "Pylott email verification",
      `<html>
        <body>
            <h2>Welcome to Pylott</h2>
            <p>Thank you for signing up with us. To verify your email address, please use the link below:</p>
            <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
            <p>Best regards,</p>
            <p>Pylott</p>
        </body>
      </html>`
    );

    return newUser;
  } catch (error: any) {
    console.log(error);
    throw new HttpError(
      error.message || "Unable to create user",
      error.statusCode || 500
    );
  }
};

export const CompanyAdminSignup = async (data: CompanyAdminSignpData) => {
    const { email, password, name } = data;
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = Date.now() + 900000; // Token valid for 15 minutes
  
    //const userPassword = generateRandomPassword()
  
    const userData = {

    name,
      email,
      password,
      verificationToken, // Add verificationToken to userData
      tokenExpires, // Add tokenExpires to userData
      role: UserRole.COMPANY_ADMIN,
    };
  
    try {
      // Check if the email is already taken
      const user = await User.findOne({ email });
      if (user) {
        throw new HttpError("Email is taken, use a different email address", 400);
      }
      const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
      const strongPassword = passwordRegex.test(password);
      if (!strongPassword) {
        throw new HttpError(
          "Password must be 8+ chars with uppercase, lowercase, number, and special character",
          400
        );
      }
  
  
      // // Hash the password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = bcrypt.hashSync(password, salt);
      }
  
      // Create the new user
      const newUser = await User.create(userData);
  
      // Remove the password from the returned user object
      if (newUser.password) {
        newUser.password = "";
      }
  
      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(
        email
      )}`;
  
      await sendEmail(
        newUser.email,
        "Pylott email verification",
        `<html>
          <body>
              <h2>Welcome to Pylott</h2>
              <p>Thank you for signing up with us. To verify your email address, please use the link below:</p>
              <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
              <p>Best regards,</p>
              <p>Pylott</p>
          </body>
        </html>`
      );
  
      return newUser;
    } catch (error: any) {
      console.log(error);
      throw new HttpError(
        error.message || "Unable to create user",
        error.statusCode || 500
      );
    }
  };

export const signIn = async (data: loginData) => {
    const verificationToken = crypto.randomBytes(32).toString("hex");
   // const tokenExpires = Date.now() + 900000; 
    try {
      const user = await User.findOne({ email: data.email });
  
        if (!user) {
          throw new HttpError('Invalid email or password', 401)
        }
          
        if (!user.isVerified) {
          //const verificationToken = generateOTP();
          const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(
            data.email
          )}`;
      
          user.verificationToken = verificationToken;
          await user.save();
  
          await sendEmail(
            user.email,
            "Pylott email verification",
            `<html>
              <body>
                  <h2>Welcome to Pylott</h2>
                  <p>Thank you for signing up with us. To verify your email address, please use the link below:</p>
                  <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
                  <p>Best regards,</p>
                  <p>Pylott</p>
              </body>
            </html>`
          );
          throw new HttpError('Verify email before log in, Verification link has been sent to your email', 404)
        }
  
        const password_valid = bcrypt.compareSync(
          data.password,
          user.password
        );
          
        if (!password_valid) {
          throw new HttpError('Invalid email or password', 401)
        };
          
        let token = jwt.sign(
          { email: user.email, role: user.role, _id:user._id},
          process.env.JWT_SECRET as string,
          { expiresIn: "1d" }
        );
          
        return { user, token }
      } catch (error: any) {
        console.error("Error loging user:", error);
        throw new HttpError(error.message || "Unable to log in user", error.statusCode || 500);
      }
  };
  

export const verifyEmailService = async (token:string) => {
 
    try {
      // Find the user by email and verification token
      const user = await User.findOne({verificationToken:token});
  
      if (!user) {
        throw new HttpError("Invalid token", 400);
      }
      
  
      // Check if the token has expired
      if (user.tokenExpires && user.tokenExpires < Date.now()) {
        throw new HttpError("Token has expired", 400);
      }
    

      let bearerToken = generateToken(user.email, user._id);

  
      // Mark the user as verified and clear the verification token
      user.isVerified = true;
      user.verificationToken = undefined;
      user.tokenExpires = undefined;
  
      await user.save();
  
      return { user: user, token: bearerToken };
    } catch (error: any) {
      throw new HttpError(error.message || "Email verification failed", 500);
    }
  };

  export const resendVerificationEmailService = async (email: string) => {
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        throw new HttpError("User not found", 404);
      }
  
      if (user.isVerified) {
        throw new HttpError("Email is already verified", 400);
      }
  
      // Generate a new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.verificationToken = verificationToken;
      user.tokenExpires = Date.now() + 900000; // Token valid for 15 minutes
  
      await user.save();
  
      // Send new verification email
      const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(
        email
      )}`;
  
      await sendEmail(
        user.email,
        "Pylott Email Verification - Resend",
        `<html>
          <body>
              <h2>Email Verification</h2>
              <p>You requested a new verification email. Click the link below to verify your email:</p>
              <a style="font-size: 20px;" href="${verificationLink}">${verificationLink}</a>
              <p>Best regards,</p>
              <p>Pylott</p>
          </body>
        </html>`
      );
  
      return { message: "Verification email sent successfully" };
    } catch (error: any) {
      throw new HttpError(error.message || "Failed to resend verification email", error.statusCode || 500);
    }
  };
  export const forgotPasswordService = async (email: string) => {
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        throw new HttpError("User not found", 404);
      }
  
      // Generate a password reset token
      const passwordResetToken = crypto.randomBytes(32).toString("hex");

      console.log('token', passwordResetToken)
  
      // Save the token and expiry time to the user
      user.verificationToken = passwordResetToken;
  
      await user.save();
  
      // Send the password reset email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${passwordResetToken}&email=${encodeURIComponent(
        email
      )}`;
  
      await sendEmail(
        user.email,
        "Reset Your Password",
        `<html>
          <body>
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password. Click the link below to proceed:</p>
              <a style="font-size: 20px;" href="${resetLink}">${resetLink}</a>
              <p>If you did not request this, please ignore this email.</p>
              <p>Best regards,</p>
              <p>Pylott</p>
          </body>
        </html>`
      );
  
      return { message: "Password reset email sent successfully" };
    } catch (error: any) {
      throw new HttpError(error.message || "Failed to send password reset email", 500);
    }
  };

 
  export const resetPasswordService = async (
    token: string,
    newPassword: string
  ) => {
    try {
      // Find the user by email and newPassword reset token
      const user = await User.findOne({ verificationToken: token });
  
      if (!user) {
        throw new HttpError("Invalid token ", 404);
      }
      if (!newPassword) {
        throw new HttpError('Please provide newPassword', 400);
      }
  
  
      // Check if the token has expired
      if (user.passwordSetupTokenExpires && user.passwordSetupTokenExpires < Date.now()) {
        throw new HttpError("Token has expired", 400);
      }
  
      // Validate the new newPassword
      const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
      const strongPassword = passwordRegex.test(newPassword);
      if (!strongPassword) {
        throw new HttpError(
          "Password must be 8+ chars with uppercase, lowercase, number, and special character",
          400
        );
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = bcrypt.hashSync(newPassword, salt);
      user.verificationToken = '';
  
  
      await user.save();
  
      return { message: "Password reset successfully" };
    } catch (error: any) {
      throw new HttpError(error.message || "Password reset failed", 500);
    }
  };


  export const sendInvitation = async (adminId: string, email: string, role: UserRole) => {
    try {
    
      const admin = await User.findOne({_id:adminId});
      console.log(admin)
      console.log('add',admin)
      if (!admin || admin.role !== UserRole.COMPANY_ADMIN) {
        throw new HttpError("Only company admins can send invitations", 403);
      }
  
        // Ensure the admin is associated with a company
    if (!admin.company) {
      throw new HttpError("Admin is not associated with a company", 400);
    }


      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new HttpError("Email is already registered", 400);
      }
  

      const invitationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpires = Date.now() + 900000; // 15 minutes
      const companyId = admin.company;
      console.log('com[p',companyId)
  
      
      
      const registrationLink = `${process.env.FRONTEND_URL}/register?token=${invitationToken}&email=${encodeURIComponent(
        email
      )}&role=${role}&company=${admin.company}`;
  
      await sendEmail(
        email,
        "You've Been Invited to Join Pylott",
        `<html>
          <body>
              <h2>Welcome to Pylott</h2>
              <p>You have been invited to join Pylott as a ${role}. Click the link below to complete your registration:</p>
              <a style="font-size: 20px;" href="${registrationLink}">Complete Registration</a>
              <p>Best regards,</p>
              <p>Pylott</p>
          </body>
        </html>`
      );
  
      return { message: "Invitation sent successfully" };
    } catch (error: any) {
      throw new HttpError(error.message || "Failed to send invitation", 500);
    }
  };




  export const completeRegistration = async (
    email: string,
    password: string,
    companyId: string // Company ID to associate the consultant with
  ) => {
    try {
     
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new HttpError("Email is already registered", 400);
      }
  

      const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
      const strongPassword = passwordRegex.test(password);
      if (!strongPassword) {
        throw new HttpError(
          "Password must be 8+ chars with uppercase, lowercase, number, and special character",
          400
        );
      }
  
      // Step 3: Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
  
    
      const newUser = new User({
        email,
        password: hashedPassword,
        company: companyId, // Associate the consultant with the company
        role: UserRole.CONSULTANT,
        isVerified: true, // Mark as verified since they were invited
      });
      await newUser.save();
  

      await Company.findByIdAndUpdate(
        companyId,
        { $push: { consultants: newUser._id } }, // Add the consultant's ID to the consultants array
        { new: true }
      );
  

      newUser.password = "";
      return newUser;
    } catch (error: any) {
      throw new HttpError(error.message || "Failed to complete registration", 500);
    }
  };