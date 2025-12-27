import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: {
    type: String,
    default: null
  },
  resetExpiry: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
