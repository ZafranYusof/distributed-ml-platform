import { Router } from 'express';
import { randomUUID } from 'crypto';
import Notebook from '../models/Notebook.js';

const router = Router();

// List notebooks
router.get('/', async (req, res) => {
  try {
    const notebooks = await Notebook.find({ userId: req.userId })
      .select('title cells createdAt updatedAt')
      .sort({ updatedAt: -1 });
    const summary = notebooks.map(n => ({
      _id: n._id,
      title: n.title,
      cellCount: n.cells.length,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notebook
router.get('/:id', async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create notebook
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const notebook = new Notebook({
      title: title || 'Untitled Notebook',
      userId: req.userId,
      cells: [{
        id: randomUUID(),
        type: 'markdown',
        content: '# New Notebook\nStart writing code or markdown here.',
        output: ''
      }]
    });
    await notebook.save();
    res.status(201).json(notebook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update notebook
router.put('/:id', async (req, res) => {
  try {
    const { title, cells } = req.body;
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });

    if (title !== undefined) notebook.title = title;
    if (cells !== undefined) notebook.cells = cells;
    notebook.updatedAt = new Date();
    await notebook.save();
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notebook
router.delete('/:id', async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });
    await notebook.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
