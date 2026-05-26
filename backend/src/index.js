import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { randomUUID } from 'crypto';
import swaggerUi from 'swagger-ui-express';
import { authMiddleware } from './middleware/auth.js';
import { getRedisClient, isRedisConnected, cacheGet, cacheSet, rateLimitCheck } from './utils/cache.js';
import { swaggerSpec } from './utils/swagger.js';
import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import configsRoutes from './routes/configs.js';
import marketplaceRoutes from './routes/marketplace.js';
import notebooksRoutes from './routes/notebooks.js';
import schedulesRoutes, { initSchedules } from './routes/schedules.js';
import abtestingRoutes from './routes/abtesting.js';
import modelVersionsRoutes from './routes/modelVersions.js';
import datasetsRoutes from './routes/datasets.js';
import experimentsRoutes from './routes/experiments.js';
import customLossRoutes from './routes/customLoss.js';
import inferenceApiRoutes from './routes/inferenceApi.js';
import inferencePublicRoutes from './routes/inferencePublic.js';
import annotationsRoutes from './routes/annotations.js';
import monitoringRoutes from './routes/monitoring.js';
import featureStoreRoutes from './routes/featureStore.js';
import hyperparamVizRoutes from './routes/hyperparamViz.js';
import lineageRoutes from './routes/lineage.js';
import modelCardsRoutes from './routes/modelCards.js';
import organizationsRoutes from './routes/organizations.js';
import orchestrationRoutes from './routes/orchestration.js';
import syntheticDataRoutes from './routes/syntheticData.js';
import mlopsRoutes from './routes/mlops.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import notificationsRoutes from './routes/notifications.js';
import githubRoutes from './routes/github.js';
import webhooksRoutes from './routes/webhooks.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 5005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/distml';

// Setup Redis adapter for Socket.io (multi-instance scaling)
async function setupRedisAdapter() {
  try {
    const Redis = (await import('ioredis')).default;
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    await Promise.all([
      new Promise((resolve, reject) => {
        pubClient.on('connect', resolve);
        pubClient.on('error', reject);
        setTimeout(() => reject(new Error('timeout')), 3000);
      }),
      new Promise((resolve, reject) => {
        subClient.on('connect', resolve);
        subClient.on('error', reject);
        setTimeout(() => reject(new Error('timeout')), 3000);
      })
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('Socket.io Redis adapter connected');
  } catch (err) {
    console.warn('Socket.io Redis adapter unavailable, using default adapter:', err.message);
  }
}

setupRedisAdapter();

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    initSchedules(io);
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Store io instance for routes
app.set('io', io);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DistML API Documentation'
}));

// In-memory storage (kept for backward compat with active training sessions)
const sessions = new Map();
const datasets = new Map();

// Track live users/sessions for real-time collaboration
const liveUsers = new Map(); // socketId -> { username, sessionId, progress, model }

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ===== Socket.io Real-time Collaboration =====
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('user:join', (data) => {
    liveUsers.set(socket.id, {
      username: data.username || 'Anonymous',
      sessionId: data.sessionId || null,
      progress: 0,
      model: data.model || null,
      status: 'idle',
      startedAt: null
    });
    io.emit('live:users', Array.from(liveUsers.values()));
  });

  socket.on('training:start', (data) => {
    const user = liveUsers.get(socket.id);
    if (user) {
      user.status = 'training';
      user.sessionId = data.sessionId;
      user.model = data.model;
      user.progress = 0;
      user.startedAt = new Date().toISOString();
      liveUsers.set(socket.id, user);
      io.emit('live:users', Array.from(liveUsers.values()));
    }
  });

  socket.on('training:progress', (data) => {
    const user = liveUsers.get(socket.id);
    if (user) {
      user.progress = data.progress;
      user.currentEpoch = data.epoch;
      user.totalEpochs = data.totalEpochs;
      user.loss = data.loss;
      user.accuracy = data.accuracy;
      liveUsers.set(socket.id, user);
      io.emit('live:users', Array.from(liveUsers.values()));
    }
  });

  socket.on('training:complete', () => {
    const user = liveUsers.get(socket.id);
    if (user) {
      user.status = 'completed';
      user.progress = 100;
      liveUsers.set(socket.id, user);
      io.emit('live:users', Array.from(liveUsers.values()));
    }
  });

  socket.on('disconnect', () => {
    liveUsers.delete(socket.id);
    io.emit('live:users', Array.from(liveUsers.values()));
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ===== Public Routes =====

// Auth routes (login/register are public, /me needs auth)
app.use('/api/auth', authRoutes);

// Marketplace - public GET, auth required for POST/DELETE (handled inside route)
app.use('/api/marketplace', marketplaceRoutes);

// ===== Protected Routes =====

// Training history (MongoDB)
app.use('/api/history', authMiddleware, historyRoutes);

// Model configs (MongoDB)
app.use('/api/configs', authMiddleware, configsRoutes);

// Notebooks
app.use('/api/notebooks', authMiddleware, notebooksRoutes);

// Schedules
app.use('/api/schedules', authMiddleware, schedulesRoutes);

// A/B Testing
app.use('/api/abtesting', authMiddleware, abtestingRoutes);

// Model Versions
app.use('/api/model-versions', authMiddleware, modelVersionsRoutes);

// Datasets (managed)
app.use('/api/managed-datasets', authMiddleware, datasetsRoutes);

// Experiments
app.use('/api/experiments', authMiddleware, experimentsRoutes);

// Custom Loss Functions
app.use('/api/custom-loss', authMiddleware, customLossRoutes);

// Inference API Management
app.use('/api/inference-endpoints', authMiddleware, inferenceApiRoutes);

// Annotations
app.use('/api/annotations', authMiddleware, annotationsRoutes);

// Monitoring & Drift Detection
app.use('/api/monitoring', authMiddleware, monitoringRoutes);

// Feature Store
app.use('/api/feature-store', authMiddleware, featureStoreRoutes);

// Hyperparameter Visualization
app.use('/api/hyperparam-viz', authMiddleware, hyperparamVizRoutes);

// Data Lineage
app.use('/api/lineage', authMiddleware, lineageRoutes);

// Model Cards
app.use('/api/model-cards', authMiddleware, modelCardsRoutes);

// Organizations (Multi-Tenant)
app.use('/api/organizations', authMiddleware, organizationsRoutes);

// Orchestration (Pipeline DAG)
app.use('/api/orchestration', authMiddleware, orchestrationRoutes);

// Synthetic Data Generator
app.use('/api/synthetic-data', authMiddleware, syntheticDataRoutes);

// MLOps CI/CD
app.use('/api/mlops', authMiddleware, mlopsRoutes);

// Admin Dashboard
app.use('/api/admin', authMiddleware, adminRoutes);

// Usage Analytics
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Notifications
app.use('/api/notifications', authMiddleware, notificationsRoutes);

// GitHub Integration
app.use('/api/integrations/github', authMiddleware, githubRoutes);

// Webhooks Integration
app.use('/api/integrations/webhooks', authMiddleware, webhooksRoutes);

// Public Inference Endpoint (API key auth, no JWT)
app.use('/api/inference', inferencePublicRoutes);

// Live sessions endpoint
app.get('/api/live-sessions', (req, res) => {
  res.json(Array.from(liveUsers.values()));
});

// ===== Dataset Routes (work with or without auth) =====

// Upload dataset
app.post('/api/dataset/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const id = randomUUID();
    const content = req.file.buffer.toString('utf-8');
    datasets.set(id, {
      id,
      name: req.file.originalname,
      content,
      uploadedAt: new Date().toISOString()
    });
    res.json({ id, name: req.file.originalname, size: req.file.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dataset
app.get('/api/dataset/:id', (req, res) => {
  const dataset = datasets.get(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  res.json(dataset);
});

// List datasets
app.get('/api/datasets', (req, res) => {
  const list = Array.from(datasets.values()).map(d => ({
    id: d.id,
    name: d.name,
    uploadedAt: d.uploadedAt
  }));
  res.json(list);
});

// ===== Training Session Routes (in-memory for active sessions) =====

// Create training session
app.post('/api/training/create', (req, res) => {
  const { datasetId, config } = req.body;
  const id = randomUUID();
  sessions.set(id, {
    id,
    datasetId,
    config,
    status: 'created',
    startedAt: new Date().toISOString(),
    metrics: [],
    workerProgress: {}
  });
  res.json({ sessionId: id });
});

// Update training metrics
app.post('/api/training/:id/metrics', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const { epoch, loss, accuracy, workerMetrics } = req.body;
  session.metrics.push({ epoch, loss, accuracy, timestamp: Date.now() });
  if (workerMetrics) {
    session.workerProgress = workerMetrics;
  }
  session.status = 'training';
  res.json({ ok: true });
});

// Complete training
app.post('/api/training/:id/complete', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  if (req.body.finalMetrics) {
    session.finalMetrics = req.body.finalMetrics;
  }
  res.json({ ok: true });
});

// Get training session
app.get('/api/training/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// List training sessions
app.get('/api/training', (req, res) => {
  const list = Array.from(sessions.values()).map(s => ({
    id: s.id,
    status: s.status,
    config: s.config,
    startedAt: s.startedAt
  }));
  res.json(list);
});

// ===== Sample Datasets =====

app.get('/api/samples', (req, res) => {
  res.json([
    { id: 'iris', name: 'Iris Dataset', description: 'Classic flower classification (150 samples, 4 features)' },
    { id: 'housing', name: 'Housing Prices', description: 'Boston housing price regression (506 samples, 13 features)' },
    { id: 'sequence', name: 'Sine Wave Sequence', description: 'Time series prediction (500 samples, sequence data)' }
  ]);
});

app.get('/api/samples/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'iris') {
    res.json({ id: 'iris', name: 'Iris Dataset', type: 'classification', content: generateIrisCSV() });
  } else if (id === 'housing') {
    res.json({ id: 'housing', name: 'Housing Prices', type: 'regression', content: generateHousingCSV() });
  } else if (id === 'sequence') {
    res.json({ id: 'sequence', name: 'Sine Wave Sequence', type: 'sequence', content: generateSequenceCSV() });
  } else {
    res.status(404).json({ error: 'Sample not found' });
  }
});

// ===== Export Model =====

app.post('/api/export', authMiddleware, (req, res) => {
  try {
    const { weights, normalization, config, format } = req.body;
    if (format === 'binary') {
      const allWeights = [];
      for (const layer of weights) {
        for (const w of layer) {
          allWeights.push(...w.data);
        }
      }
      const buffer = Buffer.from(new Float32Array(allWeights).buffer);
      const metadata = { normalization, config, layerShapes: weights.map(l => l.map(w => w.shape)) };
      res.json({
        binary: buffer.toString('base64'),
        metadata
      });
    } else {
      res.json({ weights, normalization, config });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CSV Generators =====

function generateIrisCSV() {
  const header = 'sepal_length,sepal_width,petal_length,petal_width,species';
  const species = ['setosa', 'versicolor', 'virginica'];
  const means = [
    [5.0, 3.4, 1.5, 0.2],
    [5.9, 2.8, 4.3, 1.3],
    [6.6, 3.0, 5.6, 2.0]
  ];
  const rows = [];
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 50; i++) {
      const row = means[s].map(m => (m + (Math.random() - 0.5) * 0.8).toFixed(1));
      row.push(species[s]);
      rows.push(row.join(','));
    }
  }
  return [header, ...rows].join('\n');
}

function generateHousingCSV() {
  const header = 'rooms,area,age,distance_to_center,price';
  const rows = [];
  for (let i = 0; i < 200; i++) {
    const rooms = Math.floor(Math.random() * 6) + 2;
    const area = Math.floor(rooms * 25 + Math.random() * 40 + 60);
    const age = Math.floor(Math.random() * 50);
    const distance = (Math.random() * 20 + 1).toFixed(1);
    const price = Math.floor(rooms * 50000 + area * 1000 - age * 2000 - distance * 5000 + Math.random() * 50000 + 100000);
    rows.push(`${rooms},${area},${age},${distance},${price}`);
  }
  return [header, ...rows].join('\n');
}

function generateSequenceCSV() {
  const header = 't,sin_t,cos_t,value';
  const rows = [];
  for (let i = 0; i < 500; i++) {
    const t = (i * 0.1).toFixed(2);
    const sinT = Math.sin(i * 0.1).toFixed(4);
    const cosT = Math.cos(i * 0.1).toFixed(4);
    const value = (Math.sin(i * 0.1) + 0.5 * Math.cos(i * 0.2) + (Math.random() - 0.5) * 0.1).toFixed(4);
    rows.push(`${t},${sinT},${cosT},${value}`);
  }
  return [header, ...rows].join('\n');
}

server.listen(PORT, () => {
  console.log(`ML Training Backend running on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
