import express from 'express';
import SyntheticDataConfig from '../models/SyntheticDataConfig.js';

const router = express.Router();

// List configs
router.get('/', async (req, res) => {
  try {
    const configs = await SyntheticDataConfig.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create config
router.post('/', async (req, res) => {
  try {
    const { name, config } = req.body;
    const doc = new SyntheticDataConfig({ name, config, userId: req.userId });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get config
router.get('/:id', async (req, res) => {
  try {
    const doc = await SyntheticDataConfig.findOne({ _id: req.params.id, userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Config not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete config
router.delete('/:id', async (req, res) => {
  try {
    await SyntheticDataConfig.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate synthetic data (returns CSV)
router.post('/generate', async (req, res) => {
  try {
    const { config } = req.body;
    const { rows, columns, correlations, anomalyPercent, privacyEpsilon } = config;
    
    // Generate data based on config
    const headers = columns.map(c => c.name);
    const data = [];
    
    for (let i = 0; i < rows; i++) {
      const row = {};
      for (const col of columns) {
        if (col.type === 'numeric') {
          let value;
          switch (col.distribution) {
            case 'normal':
              value = gaussianRandom(col.params?.mean || 0, col.params?.std || 1);
              break;
            case 'uniform':
              value = (col.params?.min || 0) + Math.random() * ((col.params?.max || 1) - (col.params?.min || 0));
              break;
            case 'exponential':
              value = -Math.log(1 - Math.random()) / (col.params?.lambda || 1);
              break;
            default:
              value = Math.random();
          }
          // Add Laplace noise for differential privacy
          if (privacyEpsilon) {
            value += laplaceNoise(1 / privacyEpsilon);
          }
          row[col.name] = Number(value.toFixed(4));
        } else if (col.type === 'categorical') {
          const cats = col.categories || ['A', 'B', 'C'];
          row[col.name] = cats[Math.floor(Math.random() * cats.length)];
        } else if (col.type === 'datetime') {
          const start = new Date(col.params?.start || '2020-01-01').getTime();
          const end = new Date(col.params?.end || '2024-01-01').getTime();
          row[col.name] = new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
        }
      }
      data.push(row);
    }
    
    // Inject anomalies
    if (anomalyPercent > 0) {
      const numAnomalies = Math.floor(rows * anomalyPercent / 100);
      for (let i = 0; i < numAnomalies; i++) {
        const idx = Math.floor(Math.random() * rows);
        for (const col of columns) {
          if (col.type === 'numeric') {
            data[idx][col.name] = data[idx][col.name] * (5 + Math.random() * 10);
          }
        }
      }
    }
    
    // Convert to CSV
    const csvRows = [headers.join(',')];
    for (const row of data) {
      csvRows.push(headers.map(h => row[h]).join(','));
    }
    
    res.json({ csv: csvRows.join('\n'), rowCount: rows, colCount: columns.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function gaussianRandom(mean = 0, std = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * std + mean;
}

function laplaceNoise(scale) {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export default router;
