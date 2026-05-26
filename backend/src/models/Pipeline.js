import mongoose from 'mongoose';

const pipelineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  nodes: [{
    id: String,
    type: String,
    label: String,
    config: mongoose.Schema.Types.Mixed,
    position: { x: Number, y: Number }
  }],
  edges: [{
    id: String,
    source: String,
    target: String,
    condition: mongoose.Schema.Types.Mixed
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Pipeline', pipelineSchema);
