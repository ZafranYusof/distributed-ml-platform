import mongoose from 'mongoose';

const usageEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: String, required: true },
  page: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
});

usageEventSchema.index({ userId: 1, timestamp: -1 });
usageEventSchema.index({ event: 1, timestamp: -1 });

export default mongoose.model('UsageEvent', usageEventSchema);
