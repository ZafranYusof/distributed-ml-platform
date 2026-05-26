import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['slack', 'discord', 'custom'], default: 'custom' },
  events: [{ type: String, enum: ['training_complete', 'drift_alert', 'deploy', 'error'] }],
  active: { type: Boolean, default: true },
  lastTriggered: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Webhook', webhookSchema);
