import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Lineage node schema (stored in-memory or could be persisted)
const lineageNodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pipelineId: { type: String, required: true },
  nodes: [{ 
    id: String, 
    type: { type: String }, 
    label: String, 
    data: mongoose.Schema.Types.Mixed,
    position: { x: Number, y: Number }
  }],
  edges: [{
    id: String,
    source: String,
    target: String,
    label: String
  }],
  name: { type: String, default: 'Untitled Pipeline' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LineageGraph = mongoose.model('LineageGraph', lineageNodeSchema);

// List lineage graphs
router.get('/', async (req, res) => {
  try {
    const graphs = await LineageGraph.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(graphs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single graph
router.get('/:id', async (req, res) => {
  try {
    const graph = await LineageGraph.findOne({ _id: req.params.id, userId: req.userId });
    if (!graph) return res.status(404).json({ error: 'Lineage graph not found' });
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create lineage graph
router.post('/', async (req, res) => {
  try {
    const { pipelineId, name, nodes, edges } = req.body;
    const graph = await LineageGraph.create({
      userId: req.userId,
      pipelineId: pipelineId || `pipeline-${Date.now()}`,
      name: name || 'Untitled Pipeline',
      nodes: nodes || [],
      edges: edges || []
    });
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lineage graph
router.put('/:id', async (req, res) => {
  try {
    const graph = await LineageGraph.findOne({ _id: req.params.id, userId: req.userId });
    if (!graph) return res.status(404).json({ error: 'Lineage graph not found' });
    const { name, nodes, edges } = req.body;
    if (name) graph.name = name;
    if (nodes) graph.nodes = nodes;
    if (edges) graph.edges = edges;
    graph.updatedAt = new Date();
    await graph.save();
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete lineage graph
router.delete('/:id', async (req, res) => {
  try {
    await LineageGraph.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-track: add node to existing graph
router.post('/:id/node', async (req, res) => {
  try {
    const graph = await LineageGraph.findOne({ _id: req.params.id, userId: req.userId });
    if (!graph) return res.status(404).json({ error: 'Lineage graph not found' });
    const { node, edge } = req.body;
    if (node) graph.nodes.push(node);
    if (edge) graph.edges.push(edge);
    graph.updatedAt = new Date();
    await graph.save();
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
