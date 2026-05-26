import { Router } from 'express';
import ModelConfig from '../models/ModelConfig.js';

const router = Router();

// List user's saved model configs
router.get('/', async (req, res) => {
  try {
    const configs = await ModelConfig.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single config
router.get('/:id', async (req, res) => {
  try {
    const config = await ModelConfig.findOne({ _id: req.params.id, userId: req.userId });
    if (!config) return res.status(404).json({ error: 'Config not found' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save model config
router.post('/', async (req, res) => {
  try {
    const { name, description, config } = req.body;
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }
    const modelConfig = new ModelConfig({
      userId: req.userId,
      name,
      description,
      config
    });
    await modelConfig.save();
    res.status(201).json(modelConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update config
router.put('/:id', async (req, res) => {
  try {
    const config = await ModelConfig.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    );
    if (!config) return res.status(404).json({ error: 'Config not found' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete config
router.delete('/:id', async (req, res) => {
  try {
    const config = await ModelConfig.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!config) return res.status(404).json({ error: 'Config not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
