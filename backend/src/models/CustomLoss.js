import mongoose from 'mongoose';

const customLossSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String, default: '' },
  validated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

customLossSchema.index({ userId: 1 });

export default mongoose.model('CustomLoss', customLossSchema);
