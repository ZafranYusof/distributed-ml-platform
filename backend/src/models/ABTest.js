import mongoose from 'mongoose';

const abTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modelA: {
    name: String,
    config: Object,
    weights: Object,
    normalization: Object
  },
  modelB: {
    name: String,
    config: Object,
    weights: Object,
    normalization: Object
  },
  trafficSplit: { type: Number, default: 50 }, // percentage to model A
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  results: [{
    timestamp: { type: Date, default: Date.now },
    model: { type: String, enum: ['A', 'B'] },
    input: Object,
    prediction: Number,
    actual: Number,
    error: Number
  }],
  summary: {
    totalRequests: { type: Number, default: 0 },
    modelARequests: { type: Number, default: 0 },
    modelBRequests: { type: Number, default: 0 },
    modelAAvgError: { type: Number, default: 0 },
    modelBAvgError: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ABTest', abTestSchema);
