import mongoose from 'mongoose';

const monitoringLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modelId: { type: String, required: true },
  modelName: { type: String, default: '' },
  predictions: [{ type: Number }],
  actuals: [{ type: Number }],
  driftScore: { type: Number, default: 0 },
  conceptDriftScore: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  alertTriggered: { type: Boolean, default: false },
  alertType: { type: String, enum: ['none', 'data_drift', 'concept_drift', 'accuracy_drop'], default: 'none' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
});

monitoringLogSchema.index({ userId: 1, modelId: 1, timestamp: -1 });

export default mongoose.model('MonitoringLog', monitoringLogSchema);
