import bcrypt from "bcryptjs";
import HttpError from "../utils/errorHandler";
import { AdminSignupData, EmailVerificationData, UserRole } from "../utils/user";
import User from "../models/user.model";
import crypto from "crypto";
import sendEmail from "../utils/nodemailer";
import { generateToken } from "../utils";

export const AdminSignup = async (data: AdminSignupData) => {
  const { firstname, lastname, email, password } = data;
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenExpires = Date.now() + 900000; // Token valid for 15 minutes

  const userData = {
    firstname,
    lastname,
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

    // Hash the password if provided
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