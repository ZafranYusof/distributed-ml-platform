import express from 'express';
import Deployment from '../models/Deployment.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// List deployments
router.get('/deployments', async (req, res) => {
  try {
    const deployments = await Deployment.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(deployments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create deployment
router.post('/deployments', async (req, res) => {
  try {
    const { modelId, modelName, version, gateResults } = req.body;
    const deployment = new Deployment({
      modelId,
      modelName,
      version,
      gateResults,
      status: gateResults?.passed ? 'deployed' : 'gated',
      deployedAt: gateResults?.passed ? new Date() : undefined,
      userId: req.userId
    });
    await deployment.save();
    await AuditLog.create({
      action: gateResults?.passed ? 'deploy' : 'gate_failed',
      userId: req.userId,
      details: { modelName, version, gateResults },
      resourceType: 'deployment',
      resourceId: deployment._id.toString()
    });
    res.status(201).json(deployment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rollback deployment
router.post('/deployments/:id/rollback', async (req, res) => {
  try {
    const deployment = await Deployment.findOne({ _id: req.params.id, userId: req.userId });
    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
    deployment.status = 'rolled-back';
    deployment.rolledBackAt = new Date();
    await deployment.save();
    await AuditLog.create({
      action: 'rollback',
      userId: req.userId,
      details: { modelName: deployment.modelName, version: deployment.version },
      resourceType: 'deployment',
      resourceId: deployment._id.toString()
    });
    res.json(deployment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get audit log
router.get('/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deployment by id
router.get('/deployments/:id', async (req, res) => {
  try {
    const deployment = await Deployment.findOne({ _id: req.params.id, userId: req.userId });
    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
    res.json(deployment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promote gated deployment
router.post('/deployments/:id/promote', async (req, res) => {
  try {
    const deployment = await Deployment.findOne({ _id: req.params.id, userId: req.userId });
    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
    deployment.status = 'deployed';
    deployment.deployedAt = new Date();
    await deployment.save();
    await AuditLog.create({
      action: 'promote',
      userId: req.userId,
      details: { modelName: deployment.modelName, version: deployment.version },
      resourceType: 'deployment',
      resourceId: deployment._id.toString()
    });
    res.json(deployment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
