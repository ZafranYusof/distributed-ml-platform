import mongoose from 'mongoose';

const marketplaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  tags: [String],
  metrics: {
    accuracy: Number,
    loss: Number,
    epochs: Number,
    taskType: String
  },
  modelConfig: Object,
  weights: Object,
  normalization: Object,
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

marketplaceSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('MarketplaceModel', marketplaceSchema);
