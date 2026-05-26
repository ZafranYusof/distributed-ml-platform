import mongoose from 'mongoose';

const cellSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['code', 'markdown'], default: 'code' },
  content: { type: String, default: '' },
  output: { type: String, default: '' },
  executedAt: Date
});

const notebookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cells: [cellSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notebook', notebookSchema);
