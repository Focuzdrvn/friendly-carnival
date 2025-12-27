import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlBody: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Template', templateSchema);
