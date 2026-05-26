import { Router } from 'express';
import AnnotationProject from '../models/Annotation.js';

const router = Router();

// List projects
router.get('/', async (req, res) => {
  try {
    const projects = await AnnotationProject.find({ userId: req.userId }).sort({ createdAt: -1 }).select('-data -annotations');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get project with data and annotations
router.get('/:id', async (req, res) => {
  try {
    const project = await AnnotationProject.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { name, labels, data } = req.body;
    // data is CSV string, parse into rows
    const lines = data.split('\n').filter(l => l.trim());
    const parsedData = lines.map(l => l.split(','));
    const project = await AnnotationProject.create({
      userId: req.userId, name, labels, data: parsedData, totalRows: parsedData.length - 1, annotations: []
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add annotation
router.post('/:id/annotate', async (req, res) => {
  try {
    const { rowIndex, label, annotator } = req.body;
    const project = await AnnotationProject.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.annotations.push({ rowIndex, label, annotator: annotator || 'default', timestamp: new Date() });
    await project.save();
    res.json({ ok: true, totalAnnotations: project.annotations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get annotation stats (agreement, progress)
router.get('/:id/stats', async (req, res) => {
  try {
    const project = await AnnotationProject.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const totalRows = project.totalRows;
    const annotatedRows = new Set(project.annotations.map(a => a.rowIndex)).size;
    const progress = totalRows > 0 ? (annotatedRows / totalRows) * 100 : 0;

    // Calculate inter-annotator agreement (Cohen's kappa)
    const annotators = [...new Set(project.annotations.map(a => a.annotator))];
    let agreement = 1;
    if (annotators.length >= 2) {
      const rowAnnotations = {};
      project.annotations.forEach(a => {
        if (!rowAnnotations[a.rowIndex]) rowAnnotations[a.rowIndex] = [];
        rowAnnotations[a.rowIndex].push(a);
      });

      // Calculate observed agreement (Po)
      let agreeCount = 0;
      let totalPairs = 0;
      Object.values(rowAnnotations).forEach(anns => {
        if (anns.length >= 2) {
          for (let i = 0; i < anns.length - 1; i++) {
            for (let j = i + 1; j < anns.length; j++) {
              totalPairs++;
              if (anns[i].label === anns[j].label) agreeCount++;
            }
          }
        }
      });
      const po = totalPairs > 0 ? agreeCount / totalPairs : 1;

      // Calculate chance agreement (Pe)
      // Count label frequency across all annotations in multi-annotated rows
      const labelCounts = {};
      let totalInPairs = 0;
      Object.values(rowAnnotations).forEach(anns => {
        if (anns.length >= 2) {
          anns.forEach(a => {
            labelCounts[a.label] = (labelCounts[a.label] || 0) + 1;
            totalInPairs++;
          });
        }
      });

      let pe = 0;
      if (totalInPairs > 0) {
        Object.values(labelCounts).forEach(count => {
          pe += (count / totalInPairs) ** 2;
        });
      }

      // Cohen's kappa = (Po - Pe) / (1 - Pe)
      agreement = pe < 1 ? (po - pe) / (1 - pe) : 1;
    }

    res.json({ totalRows, annotatedRows, progress, agreement, annotators, totalAnnotations: project.annotations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export annotated data as CSV
router.get('/:id/export', async (req, res) => {
  try {
    const project = await AnnotationProject.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Use consensus voting for conflicts
    const rowLabels = {};
    project.annotations.forEach(a => {
      if (!rowLabels[a.rowIndex]) rowLabels[a.rowIndex] = [];
      rowLabels[a.rowIndex].push(a.label);
    });

    const consensusLabels = {};
    Object.entries(rowLabels).forEach(([row, labels]) => {
      const counts = {};
      labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
      consensusLabels[row] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    });

    // Build CSV
    const header = project.data[0] ? [...project.data[0], 'label'].join(',') : 'label';
    const rows = project.data.slice(1).map((row, idx) => {
      const label = consensusLabels[idx + 1] || '';
      return [...row, label].join(',');
    });

    res.json({ csv: [header, ...rows].join('\n') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    await AnnotationProject.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
