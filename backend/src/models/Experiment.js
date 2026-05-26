import mongoose from 'mongoose';

const experimentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tags: [{ type: String }],
  params: { type: mongoose.Schema.Types.Mixed, default: {} },
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  artifacts: [{ name: String, type: String, data: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  duration: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

experimentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Experiment', experimentSchema);
