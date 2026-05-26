import { Router } from 'express';
import CustomLoss from '../models/CustomLoss.js';

const router = Router();

// List custom loss functions
router.get('/', async (req, res) => {
  try {
    const losses = await CustomLoss.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(losses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create custom loss function
router.post('/', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    // Basic syntax validation (runs in Node but does NOT execute the code body)
    // new Function only parses, it doesn't invoke. Actual execution is client-side in browser sandbox.
    let validated = false;
    try {
      new Function('yTrue', 'yPred', 'tf', code);
      validated = true;
    } catch (e) {
      validated = false;
    }
    const loss = await CustomLoss.create({ userId: req.userId, name, code, description, validated });
    res.json(loss);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate syntax
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    try {
      new Function('yTrue', 'yPred', 'tf', code);
      res.json({ valid: true });
    } catch (e) {
      res.json({ valid: false, error: e.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    let validated = false;
    try {
      new Function('yTrue', 'yPred', 'tf', code);
      validated = true;
    } catch (e) {
      validated = false;
    }
    const loss = await CustomLoss.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, code, description, validated },
      { new: true }
    );
    if (!loss) return res.status(404).json({ error: 'Not found' });
    res.json(loss);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await CustomLoss.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
