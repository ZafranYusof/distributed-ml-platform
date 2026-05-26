import { Router } from 'express';
import Dataset from '../models/Dataset.js';

const router = Router();

// List datasets
router.get('/', async (req, res) => {
  try {
    const { tag, category, shared } = req.query;
    const filter = { userId: req.userId };
    if (tag) filter.tags = tag;
    if (category) filter.category = category;
    if (shared === 'true') filter.shared = true;
    const datasets = await Dataset.find(filter).sort({ createdAt: -1 }).select('-data');
    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shared datasets
router.get('/shared', async (req, res) => {
  try {
    const datasets = await Dataset.find({ shared: true }).sort({ createdAt: -1 }).select('-data');
    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single dataset with data
router.get('/:id', async (req, res) => {
  try {
    const ds = await Dataset.findOne({ _id: req.params.id, $or: [{ userId: req.userId }, { shared: true }] });
    if (!ds) return res.status(404).json({ error: 'Dataset not found' });
    res.json(ds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create dataset
router.post('/', async (req, res) => {
  try {
    const { name, tags, category, data, description, shared } = req.body;
    const lines = data ? data.split('\n').filter(l => l.trim()) : [];
    const rows = Math.max(0, lines.length - 1);
    const columns = lines.length > 0 ? lines[0].split(',').length : 0;
    const ds = await Dataset.create({
      userId: req.userId, name, tags: tags || [], category: category || 'uncategorized',
      data, description, shared: shared || false, rows, columns, fileSize: data ? data.length : 0
    });
    res.json(ds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update dataset (creates new version)
router.put('/:id', async (req, res) => {
  try {
    const existing = await Dataset.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ error: 'Dataset not found' });
    const { name, tags, category, data, description, shared } = req.body;
    const lines = data ? data.split('\n').filter(l => l.trim()) : [];
    const rows = Math.max(0, lines.length - 1);
    const columns = lines.length > 0 ? lines[0].split(',').length : 0;
    existing.name = name || existing.name;
    existing.tags = tags || existing.tags;
    existing.category = category || existing.category;
    existing.description = description !== undefined ? description : existing.description;
    existing.shared = shared !== undefined ? shared : existing.shared;
    if (data) {
      existing.data = data;
      existing.rows = rows;
      existing.columns = columns;
      existing.fileSize = data.length;
      existing.version += 1;
    }
    existing.updatedAt = new Date();
    await existing.save();
    res.json(existing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete dataset
router.delete('/:id', async (req, res) => {
  try {
    await Dataset.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
