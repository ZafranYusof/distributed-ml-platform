import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  modelId: { type: String, required: true },
  modelName: { type: String, required: true },
  version: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'testing', 'gated', 'deployed', 'rolled-back', 'failed'], default: 'pending' },
  gateResults: {
    accuracy: Number,
    loss: Number,
    thresholds: { accuracy: Number, loss: Number },
    passed: Boolean
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deployedAt: Date,
  rolledBackAt: Date,
  previousVersion: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Deployment', deploymentSchema);
