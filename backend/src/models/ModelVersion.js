import mongoose from 'mongoose';

const modelVersionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modelName: { type: String, required: true },
  version: { type: Number, required: true },
  weights: { type: mongoose.Schema.Types.Mixed },
  config: { type: mongoose.Schema.Types.Mixed },
  metrics: { type: mongoose.Schema.Types.Mixed },
  architecture: { type: mongoose.Schema.Types.Mixed },
  hyperparams: { type: mongoose.Schema.Types.Mixed },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

modelVersionSchema.index({ userId: 1, modelName: 1, version: -1 });

export default mongoose.model('ModelVersion', modelVersionSchema);
