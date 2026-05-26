import express from 'express';
import Pipeline from '../models/Pipeline.js';
import PipelineRun from '../models/PipelineRun.js';

const router = express.Router();

// List pipelines
router.get('/', async (req, res) => {
  try {
    const pipelines = await Pipeline.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(pipelines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create pipeline
router.post('/', async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const pipeline = new Pipeline({ name, description, nodes, edges, userId: req.userId });
    await pipeline.save();
    res.status(201).json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pipeline
router.get('/:id', async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.userId });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update pipeline
router.put('/:id', async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, description, nodes, edges, updatedAt: new Date() },
      { new: true }
    );
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete pipeline
router.delete('/:id', async (req, res) => {
  try {
    await Pipeline.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run pipeline
router.post('/:id/run', async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.userId });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    const nodeStatuses = pipeline.nodes.map(n => ({
      nodeId: n.id,
      status: 'pending',
      retries: 0,
      logs: []
    }));
    const run = new PipelineRun({
      pipelineId: pipeline._id,
      status: 'running',
      nodeStatuses,
      userId: req.userId,
      startedAt: new Date()
    });
    await run.save();
    res.status(201).json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pipeline runs
router.get('/:id/runs', async (req, res) => {
  try {
    const runs = await PipelineRun.find({ pipelineId: req.params.id, userId: req.userId })
      .sort({ startedAt: -1 });
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update run node status
router.put('/runs/:runId/nodes/:nodeId', async (req, res) => {
  try {
    const { status, logs, error } = req.body;
    const run = await PipelineRun.findById(req.params.runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    const node = run.nodeStatuses.find(n => n.nodeId === req.params.nodeId);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    node.status = status;
    if (status === 'running') node.startedAt = new Date();
    if (status === 'success' || status === 'failed') node.completedAt = new Date();
    if (logs) node.logs.push(...logs);
    if (error) node.error = error;
    if (status === 'failed' && node.retries < 3) node.retries++;
    // Check if all nodes complete
    const allDone = run.nodeStatuses.every(n => ['success', 'failed', 'skipped'].includes(n.status));
    if (allDone) {
      run.status = run.nodeStatuses.some(n => n.status === 'failed') ? 'failed' : 'completed';
      run.completedAt = new Date();
    }
    await run.save();
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
