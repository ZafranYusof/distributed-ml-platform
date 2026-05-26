import { Router } from 'express';
import MarketplaceModel from '../models/Marketplace.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// List all models (public)
router.get('/', async (req, res) => {
  try {
    const { search, tag, sort } = req.query;
    let query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (tag) {
      query.tags = tag;
    }
    let sortOption = { createdAt: -1 };
    if (sort === 'downloads') sortOption = { downloads: -1 };
    if (sort === 'accuracy') sortOption = { 'metrics.accuracy': -1 };

    const models = await MarketplaceModel.find(query).sort(sortOption).limit(50);
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single model
router.get('/:id', async (req, res) => {
  try {
    const model = await MarketplaceModel.findById(req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    res.json(model);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish model (auth required)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, tags, metrics, modelConfig, weights, normalization } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const model = new MarketplaceModel({
      name,
      description,
      author: req.userId,
      authorName: user.username,
      tags: tags || [],
      metrics: metrics || {},
      modelConfig,
      weights,
      normalization
    });
    await model.save();
    res.status(201).json(model);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download/increment counter (public)
router.post('/:id/download', async (req, res) => {
  try {
    const model = await MarketplaceModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!model) return res.status(404).json({ error: 'Model not found' });
    res.json(model);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete model (owner only, auth required)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const model = await MarketplaceModel.findById(req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    if (model.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await model.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
