import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tags: [{ type: String }],
  category: { type: String, default: 'uncategorized' },
  data: { type: String },
  version: { type: Number, default: 1 },
  shared: { type: Boolean, default: false },
  description: { type: String, default: '' },
  rows: { type: Number, default: 0 },
  columns: { type: Number, default: 0 },
  fileSize: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

datasetSchema.index({ userId: 1, name: 1 });

export default mongoose.model('Dataset', datasetSchema);
