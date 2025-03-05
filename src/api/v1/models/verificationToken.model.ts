import mongoose from 'mongoose';
import { IVerificationToken } from '../utils/user';



const VerificationTokenSchema = new mongoose.Schema<IVerificationToken>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Token expires in 1 hour
  },
  expiresAt: {
    type: Date,
    required: true
  },
  tokenType: {
    type: String,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
    required: true
  }
});

const VerificationToken = mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);

export default VerificationToken;