import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  code: { type: String, default: '' },
  version: { type: Number, default: 1 },
  datasetId: { type: String, default: '' },
  datasetName: { type: String, default: '' },
  outputPreview: { type: mongoose.Schema.Types.Mixed, default: null },
  tags: [{ type: String }],
  lineage: {
    sourceDataset: { type: String, default: '' },
    transformations: [{ type: String }],
    parentFeatures: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

featureSchema.index({ userId: 1, name: 1, version: -1 });

export default mongoose.model('Feature', featureSchema);
