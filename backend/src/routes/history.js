import { Router } from 'express';
import TrainingSession from '../models/TrainingSession.js';

const router = Router();

// List user's training history
router.get('/', async (req, res) => {
  try {
    const sessions = await TrainingSession.find({ userId: req.userId })
      .sort({ startedAt: -1 })
      .select('-modelWeights')
      .limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single training session
router.get('/:id', async (req, res) => {
  try {
    const session = await TrainingSession.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session with weights (for model reload)
router.get('/:id/weights', async (req, res) => {
  try {
    const session = await TrainingSession.findOne({ _id: req.params.id, userId: req.userId })
      .select('+modelWeights');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ weights: session.modelWeights, normalization: session.normalization });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save training session
router.post('/', async (req, res) => {
  try {
    const { name, datasetName, config, metrics, finalMetrics, modelWeights, normalization, status } = req.body;
    const session = new TrainingSession({
      userId: req.userId,
      name: name || `Training ${new Date().toLocaleString()}`,
      datasetName,
      config,
      metrics,
      finalMetrics,
      modelWeights,
      normalization,
      status: status || 'completed',
      completedAt: status === 'completed' ? new Date() : undefined
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update training session
router.put('/:id', async (req, res) => {
  try {
    const session = await TrainingSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete training session
router.delete('/:id', async (req, res) => {
  try {
    const session = await TrainingSession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare multiple sessions
router.post('/compare', async (req, res) => {
  try {
    const { sessionIds } = req.body;
    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length < 2) {
      return res.status(400).json({ error: 'Provide at least 2 session IDs to compare' });
    }
    const sessions = await TrainingSession.find({
      _id: { $in: sessionIds },
      userId: req.userId
    }).select('-modelWeights');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
