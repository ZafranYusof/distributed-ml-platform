import mongoose from 'mongoose';

const inferenceEndpointSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modelId: { type: String, required: true },
  modelName: { type: String, required: true },
  apiKey: { type: String, required: true },
  rateLimit: { type: Number, default: 100 },
  active: { type: Boolean, default: true },
  weights: { type: mongoose.Schema.Types.Mixed },
  config: { type: mongoose.Schema.Types.Mixed },
  normalization: { type: mongoose.Schema.Types.Mixed },
  requests: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  totalLatency: { type: Number, default: 0 },
  dailyStats: [{ date: String, requests: Number, errors: Number, avgLatency: Number }],
  createdAt: { type: Date, default: Date.now }
});

inferenceEndpointSchema.index({ apiKey: 1 });
inferenceEndpointSchema.index({ userId: 1 });

export default mongoose.model('InferenceEndpoint', inferenceEndpointSchema);
