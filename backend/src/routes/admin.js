import { Router } from 'express';
import User from '../models/User.js';
import TrainingSession from '../models/TrainingSession.js';
import Dataset from '../models/Dataset.js';
import Experiment from '../models/Experiment.js';
import UsageEvent from '../models/UsageEvent.js';

const router = Router();

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform admin statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Platform statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalUsers, totalSessions, todaySessions, totalDatasets, totalExperiments] = await Promise.all([
      User.countDocuments(),
      TrainingSession.countDocuments(),
      TrainingSession.countDocuments({ createdAt: { $gte: todayStart } }),
      Dataset.countDocuments(),
      Experiment.countDocuments()
    ]);

    // Popular models (top 5 by usage)
    const popularModels = await TrainingSession.aggregate([
      { $group: { _id: '$modelType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent activity
    const recentActivity = await UsageEvent.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'username');

    res.json({
      totalUsers,
      totalSessions,
      todaySessions,
      totalDatasets,
      totalExperiments,
      popularModels: popularModels.map(m => ({ model: m._id || 'unknown', count: m.count })),
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/users-over-time:
 *   get:
 *     summary: Get user registration over time
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User registration timeline
 */
router.get('/users-over-time', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(data.map(d => ({ date: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/training-per-day:
 *   get:
 *     summary: Get training jobs per day
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Training jobs timeline
 */
router.get('/training-per-day', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data = await TrainingSession.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(data.map(d => ({ date: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
