import { Router } from 'express';
import { randomUUID } from 'crypto';
import InferenceEndpoint from '../models/InferenceEndpoint.js';

const router = Router();

// List endpoints
router.get('/', async (req, res) => {
  try {
    const endpoints = await InferenceEndpoint.find({ userId: req.userId }).sort({ createdAt: -1 }).select('-weights');
    res.json(endpoints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create endpoint (deploy model)
router.post('/', async (req, res) => {
  try {
    const { modelName, weights, config, normalization, rateLimit } = req.body;
    const apiKey = `dml_${randomUUID().replace(/-/g, '')}`;
    const modelId = randomUUID();
    const endpoint = await InferenceEndpoint.create({
      userId: req.userId, modelId, modelName, apiKey, rateLimit: rateLimit || 100,
      weights, config, normalization
    });
    res.json({ ...endpoint.toObject(), apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get endpoint stats
router.get('/:id', async (req, res) => {
  try {
    const endpoint = await InferenceEndpoint.findOne({ _id: req.params.id, userId: req.userId }).select('-weights');
    if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' });
    res.json(endpoint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update endpoint settings
router.put('/:id', async (req, res) => {
  try {
    const { rateLimit, active } = req.body;
    const endpoint = await InferenceEndpoint.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { rateLimit, active },
      { new: true }
    ).select('-weights');
    if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' });
    res.json(endpoint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete endpoint
router.delete('/:id', async (req, res) => {
  try {
    await InferenceEndpoint.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Regenerate API key
router.post('/:id/regenerate-key', async (req, res) => {
  try {
    const apiKey = `dml_${randomUUID().replace(/-/g, '')}`;
    const endpoint = await InferenceEndpoint.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { apiKey },
      { new: true }
    ).select('-weights');
    if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' });
    res.json(endpoint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
