import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cronExpression: { type: String, required: true },
  datasetConfig: Object,
  modelConfig: Object,
  enabled: { type: Boolean, default: true },
  lastRun: Date,
  nextRun: Date,
  lastStatus: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  runHistory: [{
    startedAt: Date,
    completedAt: Date,
    status: String,
    metrics: Object
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Schedule', scheduleSchema);
