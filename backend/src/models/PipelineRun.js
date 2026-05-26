import mongoose from 'mongoose';

const pipelineRunSchema = new mongoose.Schema({
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pipeline', required: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  nodeStatuses: [{
    nodeId: String,
    status: { type: String, enum: ['pending', 'running', 'success', 'failed', 'skipped'] },
    startedAt: Date,
    completedAt: Date,
    retries: { type: Number, default: 0 },
    logs: [String],
    error: String
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
});

export default mongoose.model('PipelineRun', pipelineRunSchema);
