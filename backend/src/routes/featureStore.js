import { Router } from 'express';
import Feature from '../models/Feature.js';

const router = Router();

// List features
router.get('/', async (req, res) => {
  try {
    const { search, datasetId, tag } = req.query;
    const filter = { userId: req.userId };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (datasetId) filter.datasetId = datasetId;
    if (tag) filter.tags = tag;
    const features = await Feature.find(filter).sort({ createdAt: -1 });
    res.json(features);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single feature
router.get('/:id', async (req, res) => {
  try {
    const feature = await Feature.findOne({ _id: req.params.id, userId: req.userId });
    if (!feature) return res.status(404).json({ error: 'Feature not found' });
    res.json(feature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create feature
router.post('/', async (req, res) => {
  try {
    const { name, description, code, datasetId, datasetName, tags, lineage } = req.body;
    // Check if feature with same name exists to auto-version
    const existing = await Feature.findOne({ userId: req.userId, name }).sort({ version: -1 });
    const version = existing ? existing.version + 1 : 1;

    const feature = await Feature.create({
      userId: req.userId, name, description, code,
      version, datasetId: datasetId || '', datasetName: datasetName || '',
      tags: tags || [], lineage: lineage || {}
    });
    res.json(feature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update feature
router.put('/:id', async (req, res) => {
  try {
    const feature = await Feature.findOne({ _id: req.params.id, userId: req.userId });
    if (!feature) return res.status(404).json({ error: 'Feature not found' });
    const { name, description, code, datasetId, datasetName, tags, outputPreview, lineage } = req.body;
    if (name) feature.name = name;
    if (description !== undefined) feature.description = description;
    if (code !== undefined) feature.code = code;
    if (datasetId !== undefined) feature.datasetId = datasetId;
    if (datasetName !== undefined) feature.datasetName = datasetName;
    if (tags) feature.tags = tags;
    if (outputPreview !== undefined) feature.outputPreview = outputPreview;
    if (lineage) feature.lineage = lineage;
    feature.updatedAt = new Date();
    await feature.save();
    res.json(feature);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete feature
router.delete('/:id', async (req, res) => {
  try {
    await Feature.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
