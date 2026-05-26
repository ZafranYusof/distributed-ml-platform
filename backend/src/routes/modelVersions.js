import { Router } from 'express';
import ModelVersion from '../models/ModelVersion.js';

const router = Router();

// Get all versions for a model
router.get('/', async (req, res) => {
  try {
    const { modelName } = req.query;
    const filter = { userId: req.userId };
    if (modelName) filter.modelName = modelName;
    const versions = await ModelVersion.find(filter).sort({ createdAt: -1 }).select('-weights');
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get distinct model names
router.get('/models', async (req, res) => {
  try {
    const models = await ModelVersion.distinct('modelName', { userId: req.userId });
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new version (auto-increment)
router.post('/', async (req, res) => {
  try {
    const { modelName, weights, config, metrics, architecture, hyperparams, description } = req.body;
    const latest = await ModelVersion.findOne({ userId: req.userId, modelName }).sort({ version: -1 });
    const version = latest ? latest.version + 1 : 1;
    const mv = await ModelVersion.create({
      userId: req.userId, modelName, version, weights, config, metrics, architecture, hyperparams, description
    });
    res.json(mv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific version with weights (for rollback)
router.get('/:id', async (req, res) => {
  try {
    const mv = await ModelVersion.findOne({ _id: req.params.id, userId: req.userId });
    if (!mv) return res.status(404).json({ error: 'Version not found' });
    res.json(mv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare two versions
router.get('/compare/:id1/:id2', async (req, res) => {
  try {
    const v1 = await ModelVersion.findOne({ _id: req.params.id1, userId: req.userId }).select('-weights');
    const v2 = await ModelVersion.findOne({ _id: req.params.id2, userId: req.userId }).select('-weights');
    if (!v1 || !v2) return res.status(404).json({ error: 'Version not found' });
    res.json({ v1, v2 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a version
router.delete('/:id', async (req, res) => {
  try {
    await ModelVersion.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
