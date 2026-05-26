import { Router } from 'express';
import ModelCard from '../models/ModelCard.js';

const router = Router();

// List model cards
router.get('/', async (req, res) => {
  try {
    const cards = await ModelCard.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single model card
router.get('/:id', async (req, res) => {
  try {
    const card = await ModelCard.findOne({ _id: req.params.id, userId: req.userId });
    if (!card) return res.status(404).json({ error: 'Model card not found' });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create / auto-generate model card
router.post('/', async (req, res) => {
  try {
    const { modelId, modelName, content } = req.body;

    // Auto-generate markdown from content
    const c = content || {};
    const markdown = generateMarkdown(modelName || modelId, c);

    const card = await ModelCard.create({
      userId: req.userId, modelId, modelName: modelName || modelId,
      content: {
        description: c.description || '',
        intendedUse: c.intendedUse || '',
        limitations: c.limitations || '',
        performanceMetrics: c.performanceMetrics || {},
        trainingDataSummary: c.trainingDataSummary || '',
        hyperparameters: c.hyperparameters || {},
        biasAnalysis: c.biasAnalysis || {}
      },
      markdown
    });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update model card
router.put('/:id', async (req, res) => {
  try {
    const card = await ModelCard.findOne({ _id: req.params.id, userId: req.userId });
    if (!card) return res.status(404).json({ error: 'Model card not found' });
    const { modelName, content } = req.body;
    if (modelName) card.modelName = modelName;
    if (content) {
      card.content = { ...card.content, ...content };
      card.markdown = generateMarkdown(card.modelName, card.content);
    }
    card.updatedAt = new Date();
    await card.save();
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete model card
router.delete('/:id', async (req, res) => {
  try {
    await ModelCard.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateMarkdown(name, content) {
  let md = `# Model Card: ${name}\n\n`;
  if (content.description) md += `## Description\n${content.description}\n\n`;
  if (content.intendedUse) md += `## Intended Use\n${content.intendedUse}\n\n`;
  if (content.limitations) md += `## Limitations\n${content.limitations}\n\n`;
  if (content.performanceMetrics && Object.keys(content.performanceMetrics).length > 0) {
    md += `## Performance Metrics\n`;
    for (const [k, v] of Object.entries(content.performanceMetrics)) {
      md += `- **${k}**: ${v}\n`;
    }
    md += '\n';
  }
  if (content.trainingDataSummary) md += `## Training Data\n${content.trainingDataSummary}\n\n`;
  if (content.hyperparameters && Object.keys(content.hyperparameters).length > 0) {
    md += `## Hyperparameters\n`;
    for (const [k, v] of Object.entries(content.hyperparameters)) {
      md += `- **${k}**: ${v}\n`;
    }
    md += '\n';
  }
  if (content.biasAnalysis && Object.keys(content.biasAnalysis).length > 0) {
    md += `## Bias Analysis\n`;
    for (const [k, v] of Object.entries(content.biasAnalysis)) {
      md += `- **${k}**: ${JSON.stringify(v)}\n`;
    }
    md += '\n';
  }
  return md;
}

export default router;
