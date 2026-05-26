import mongoose from 'mongoose';

const githubIntegrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoUrl: { type: String, required: true },
  personalAccessToken: { type: String, required: true },
  repoName: { type: String },
  connected: { type: Boolean, default: true },
  lastSync: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('GitHubIntegration', githubIntegrationSchema);
