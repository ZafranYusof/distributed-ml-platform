import { Router } from 'express';
import Experiment from '../models/Experiment.js';

const router = Router();

// List experiments
router.get('/', async (req, res) => {
  try {
    const { tag, status, search } = req.query;
    const filter = { userId: req.userId };
    if (tag) filter.tags = tag;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const experiments = await Experiment.find(filter).sort({ createdAt: -1 });
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single experiment
router.get('/:id', async (req, res) => {
  try {
    const exp = await Experiment.findOne({ _id: req.params.id, userId: req.userId });
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create experiment
router.post('/', async (req, res) => {
  try {
    const { name, tags, params, metrics, artifacts, status, duration } = req.body;
    const exp = await Experiment.create({
      userId: req.userId, name, tags: tags || [], params: params || {},
      metrics: metrics || {}, artifacts: artifacts || [], status: status || 'running', duration: duration || 0
    });
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update experiment (log metrics/artifacts)
router.put('/:id', async (req, res) => {
  try {
    const exp = await Experiment.findOne({ _id: req.params.id, userId: req.userId });
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    const { metrics, artifacts, status, duration, params } = req.body;
    if (metrics) exp.metrics = { ...exp.metrics, ...metrics };
    if (params) exp.params = { ...exp.params, ...params };
    if (artifacts) exp.artifacts.push(...artifacts);
    if (status) {
      exp.status = status;
      if (status === 'completed' || status === 'failed') exp.completedAt = new Date();
    }
    if (duration) exp.duration = duration;
    await exp.save();
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete experiment
router.delete('/:id', async (req, res) => {
  try {
    await Experiment.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare experiments
router.post('/compare', async (req, res) => {
  try {
    const { ids } = req.body;
    const experiments = await Experiment.find({ _id: { $in: ids }, userId: req.userId });
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
