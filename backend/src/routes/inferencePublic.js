import { Router } from 'express';
import InferenceEndpoint from '../models/InferenceEndpoint.js';

const router = Router();

// Public inference endpoint - POST /api/inference/:modelId
// Requires X-API-Key header
router.post('/:modelId', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required (X-API-Key header)' });

    const endpoint = await InferenceEndpoint.findOne({ modelId: req.params.modelId, apiKey, active: true });
    if (!endpoint) return res.status(404).json({ error: 'Endpoint not found or invalid API key' });

    // Rate limiting check (simple per-day)
    const today = new Date().toISOString().split('T')[0];
    const todayStat = endpoint.dailyStats.find(s => s.date === today);
    if (todayStat && todayStat.requests >= endpoint.rateLimit) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const startTime = Date.now();

    // Simulate inference using stored weights/config
    // In production this would run TensorFlow.js inference
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'Input data required' });

    // Simple forward pass simulation based on stored config
    const inputArray = Array.isArray(input) ? input : [input];
    const predictions = inputArray.map(inp => {
      // Simulate prediction based on model type
      if (endpoint.config?.type === 'classification') {
        const numClasses = endpoint.config.outputSize || 3;
        const probs = Array.from({ length: numClasses }, () => Math.random());
        const sum = probs.reduce((a, b) => a + b, 0);
        return probs.map(p => p / sum);
      } else {
        return [Math.random() * 100];
      }
    });

    const latency = Date.now() - startTime;

    // Update stats
    endpoint.requests += 1;
    endpoint.totalLatency += latency;
    if (todayStat) {
      todayStat.requests += 1;
      todayStat.avgLatency = ((todayStat.avgLatency * (todayStat.requests - 1)) + latency) / todayStat.requests;
    } else {
      endpoint.dailyStats.push({ date: today, requests: 1, errors: 0, avgLatency: latency });
    }
    // Keep only last 30 days
    if (endpoint.dailyStats.length > 30) {
      endpoint.dailyStats = endpoint.dailyStats.slice(-30);
    }
    await endpoint.save();

    res.json({ predictions, latency, modelId: req.params.modelId });
  } catch (err) {
    // Track error
    try {
      const apiKey = req.headers['x-api-key'];
      if (apiKey) {
        const endpoint = await InferenceEndpoint.findOne({ modelId: req.params.modelId, apiKey });
        if (endpoint) {
          endpoint.errors += 1;
          const today = new Date().toISOString().split('T')[0];
          const todayStat = endpoint.dailyStats.find(s => s.date === today);
          if (todayStat) todayStat.errors += 1;
          await endpoint.save();
        }
      }
    } catch (e) { /* ignore tracking errors */ }
    res.status(500).json({ error: err.message });
  }
});

export default router;
