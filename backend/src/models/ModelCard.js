import mongoose from 'mongoose';

const modelCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modelId: { type: String, required: true },
  modelName: { type: String, default: '' },
  content: {
    description: { type: String, default: '' },
    intendedUse: { type: String, default: '' },
    limitations: { type: String, default: '' },
    performanceMetrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    trainingDataSummary: { type: String, default: '' },
    hyperparameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    biasAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  markdown: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

modelCardSchema.index({ userId: 1, modelId: 1 });

export default mongoose.model('ModelCard', modelCardSchema);
