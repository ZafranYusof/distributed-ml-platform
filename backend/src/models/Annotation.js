import mongoose from 'mongoose';

const annotationProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  labels: [{ type: String }],
  data: [{ type: mongoose.Schema.Types.Mixed }],
  annotations: [{
    rowIndex: Number,
    label: String,
    annotator: String,
    timestamp: { type: Date, default: Date.now }
  }],
  totalRows: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

annotationProjectSchema.index({ userId: 1 });

export default mongoose.model('AnnotationProject', annotationProjectSchema);
