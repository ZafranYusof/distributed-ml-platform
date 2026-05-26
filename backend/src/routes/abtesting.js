import { Router } from 'express';
import ABTest from '../models/ABTest.js';

const router = Router();

// List A/B tests
router.get('/', async (req, res) => {
  try {
    const tests = await ABTest.find({ userId: req.userId }).sort({ createdAt: -1 });
    // Return without full results array to keep response small
    const summary = tests.map(t => ({
      _id: t._id,
      name: t.name,
      status: t.status,
      trafficSplit: t.trafficSplit,
      modelA: { name: t.modelA.name },
      modelB: { name: t.modelB.name },
      summary: t.summary,
      createdAt: t.createdAt
    }));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single A/B test with results
router.get('/:id', async (req, res) => {
  try {
    const test = await ABTest.findOne({ _id: req.params.id, userId: req.userId });
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    // Return last 100 results only
    const result = test.toObject();
    result.results = result.results.slice(-100);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create A/B test
router.post('/', async (req, res) => {
  try {
    const { name, modelA, modelB, trafficSplit } = req.body;
    const test = new ABTest({
      name,
      userId: req.userId,
      modelA,
      modelB,
      trafficSplit: trafficSplit || 50
    });
    await test.save();
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send prediction request (routes to A or B based on split)
router.post('/:id/predict', async (req, res) => {
  try {
    const test = await ABTest.findOne({ _id: req.params.id, userId: req.userId });
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    if (test.status !== 'active') return res.status(400).json({ error: 'Test is not active' });

    const { input, actual } = req.body;
    const useModelA = Math.random() * 100 < test.trafficSplit;
    const selectedModel = useModelA ? 'A' : 'B';

    // The actual prediction happens client-side with TF.js
    // We just record which model was selected and track results
    const result = {
      timestamp: new Date(),
      model: selectedModel,
      input,
      prediction: req.body.prediction,
      actual: actual !== undefined ? actual : null,
      error: actual !== undefined ? Math.abs(req.body.prediction - actual) : null
    };

    test.results.push(result);
    test.summary.totalRequests += 1;

    if (selectedModel === 'A') {
      test.summary.modelARequests += 1;
      if (result.error !== null) {
        const prevTotal = test.summary.modelAAvgError * (test.summary.modelARequests - 1);
        test.summary.modelAAvgError = (prevTotal + result.error) / test.summary.modelARequests;
      }
    } else {
      test.summary.modelBRequests += 1;
      if (result.error !== null) {
        const prevTotal = test.summary.modelBAvgError * (test.summary.modelBRequests - 1);
        test.summary.modelBAvgError = (prevTotal + result.error) / test.summary.modelBRequests;
      }
    }

    await test.save();
    res.json({ selectedModel, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status },
      { new: true }
    );
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const test = await ABTest.findOne({ _id: req.params.id, userId: req.userId });
    if (!test) return res.status(404).json({ error: 'A/B test not found' });
    await test.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
