import { Router } from 'express';
import Experiment from '../models/Experiment.js';

const router = Router();

// Get hyperparameter visualization data across experiments
router.get('/', async (req, res) => {
  try {
    const { tags } = req.query;
    const filter = { userId: req.userId, status: 'completed' };
    if (tags) filter.tags = { $in: tags.split(',') };
    const experiments = await Experiment.find(filter).sort({ createdAt: -1 }).limit(200);

    // Extract params and metrics for parallel coordinates
    const data = experiments.map(exp => ({
      id: exp._id,
      name: exp.name,
      params: exp.params || {},
      metrics: exp.metrics || {},
      tags: exp.tags || []
    }));

    // Calculate param importance (correlation with primary metric)
    const importance = calculateImportance(data);

    res.json({ experiments: data, importance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calculateImportance(data) {
  if (data.length < 3) return {};

  // Get all numeric params
  const allParams = new Set();
  data.forEach(d => {
    Object.entries(d.params).forEach(([k, v]) => {
      if (typeof v === 'number') allParams.add(k);
    });
  });

  // Get primary metric (first numeric metric found)
  let metricKey = null;
  for (const d of data) {
    for (const [k, v] of Object.entries(d.metrics)) {
      if (typeof v === 'number') { metricKey = k; break; }
    }
    if (metricKey) break;
  }

  if (!metricKey) return {};

  const importance = {};
  for (const param of allParams) {
    const pairs = data
      .filter(d => typeof d.params[param] === 'number' && typeof d.metrics[metricKey] === 'number')
      .map(d => [d.params[param], d.metrics[metricKey]]);

    if (pairs.length < 3) { importance[param] = 0; continue; }

    // Pearson correlation
    const n = pairs.length;
    const sumX = pairs.reduce((s, p) => s + p[0], 0);
    const sumY = pairs.reduce((s, p) => s + p[1], 0);
    const sumXY = pairs.reduce((s, p) => s + p[0] * p[1], 0);
    const sumX2 = pairs.reduce((s, p) => s + p[0] ** 2, 0);
    const sumY2 = pairs.reduce((s, p) => s + p[1] ** 2, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    importance[param] = den === 0 ? 0 : Math.abs(num / den);
  }

  return importance;
}

export default router;
