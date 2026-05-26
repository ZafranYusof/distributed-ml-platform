import { Router } from 'express';
import MonitoringLog from '../models/MonitoringLog.js';

const router = Router();

// List monitoring logs for a model
router.get('/', async (req, res) => {
  try {
    const { modelId, limit } = req.query;
    const filter = { userId: req.userId };
    if (modelId) filter.modelId = modelId;
    const logs = await MonitoringLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await MonitoringLog.find({
      userId: req.userId,
      alertTriggered: true
    }).sort({ timestamp: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get model list (distinct models being monitored)
router.get('/models', async (req, res) => {
  try {
    const models = await MonitoringLog.distinct('modelId', { userId: req.userId });
    const modelDetails = await Promise.all(models.map(async (modelId) => {
      const latest = await MonitoringLog.findOne({ userId: req.userId, modelId }).sort({ timestamp: -1 });
      return { modelId, modelName: latest?.modelName || modelId, lastChecked: latest?.timestamp };
    }));
    res.json(modelDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log predictions + actuals
router.post('/', async (req, res) => {
  try {
    const { modelId, modelName, predictions, actuals, metadata } = req.body;

    // Calculate drift score (KL divergence approximation)
    let driftScore = 0;
    if (predictions && actuals && predictions.length > 0 && actuals.length > 0) {
      const predMean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
      const actMean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
      const predStd = Math.sqrt(predictions.reduce((s, x) => s + (x - predMean) ** 2, 0) / predictions.length) || 1;
      const actStd = Math.sqrt(actuals.reduce((s, x) => s + (x - actMean) ** 2, 0) / actuals.length) || 1;
      // Simplified KL divergence for Gaussians
      driftScore = Math.log(actStd / predStd) + (predStd ** 2 + (predMean - actMean) ** 2) / (2 * actStd ** 2) - 0.5;
      driftScore = Math.abs(driftScore);
    }

    // Calculate accuracy
    let accuracy = 0;
    if (predictions && actuals && predictions.length === actuals.length) {
      const threshold = 0.5;
      let correct = 0;
      for (let i = 0; i < predictions.length; i++) {
        if (Math.abs(predictions[i] - actuals[i]) < threshold) correct++;
      }
      accuracy = correct / predictions.length;
    }

    // Concept drift: compare accuracy to historical average
    let conceptDriftScore = 0;
    const recentLogs = await MonitoringLog.find({ userId: req.userId, modelId })
      .sort({ timestamp: -1 }).limit(10);
    if (recentLogs.length > 0) {
      const avgAccuracy = recentLogs.reduce((s, l) => s + l.accuracy, 0) / recentLogs.length;
      conceptDriftScore = Math.max(0, avgAccuracy - accuracy);
    }

    // Determine alert
    const driftThreshold = 0.5;
    const conceptDriftThreshold = 0.15;
    const accuracyThreshold = 0.7;
    let alertTriggered = false;
    let alertType = 'none';

    if (driftScore > driftThreshold) {
      alertTriggered = true;
      alertType = 'data_drift';
    } else if (conceptDriftScore > conceptDriftThreshold) {
      alertTriggered = true;
      alertType = 'concept_drift';
    } else if (accuracy < accuracyThreshold && recentLogs.length > 3) {
      alertTriggered = true;
      alertType = 'accuracy_drop';
    }

    const log = await MonitoringLog.create({
      userId: req.userId, modelId, modelName: modelName || modelId,
      predictions, actuals, driftScore, conceptDriftScore, accuracy,
      alertTriggered, alertType, metadata
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger retrain (placeholder - emits socket event)
router.post('/retrain', async (req, res) => {
  try {
    const { modelId } = req.body;
    // In a real system this would trigger a training job
    res.json({ ok: true, message: `Retrain triggered for model ${modelId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete logs for a model
router.delete('/:modelId', async (req, res) => {
  try {
    await MonitoringLog.deleteMany({ userId: req.userId, modelId: req.params.modelId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
