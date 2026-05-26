import mongoose from 'mongoose';

const syntheticDataConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  config: {
    rows: { type: Number, default: 1000 },
    columns: [{
      name: String,
      type: { type: String, enum: ['numeric', 'categorical', 'datetime'] },
      distribution: { type: String, enum: ['normal', 'uniform', 'exponential', 'custom'] },
      params: mongoose.Schema.Types.Mixed,
      categories: [String]
    }],
    correlations: mongoose.Schema.Types.Mixed,
    anomalyPercent: { type: Number, default: 0 },
    privacyEpsilon: Number
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SyntheticDataConfig', syntheticDataConfigSchema);
