import { Router } from 'express';
import mongoose from 'mongoose';
import UsageEvent from '../models/UsageEvent.js';

const router = Router();

/**
 * @swagger
 * /api/analytics/track:
 *   post:
 *     summary: Track a usage event
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               page:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Event tracked
 */
router.post('/track', async (req, res) => {
  try {
    const { event, page, metadata } = req.body;
    await UsageEvent.create({
      userId: req.userId,
      event,
      page,
      metadata
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/analytics/my-stats:
 *   get:
 *     summary: Get current user's usage statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: User usage stats
 */
router.get('/my-stats', async (req, res) => {
  try {
    const userId = req.userId;
    const [totalEvents, pageVisits, recentEvents] = await Promise.all([
      UsageEvent.countDocuments({ userId }),
      UsageEvent.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      UsageEvent.find({ userId }).sort({ timestamp: -1 }).limit(20)
    ]);

    res.json({ totalEvents, pageVisits, recentEvents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/analytics/platform:
 *   get:
 *     summary: Get platform-wide analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Platform analytics
 */
router.get('/platform', async (req, res) => {
  try {
    // Feature usage heatmap (page visits)
    const pageHeatmap = await UsageEvent.aggregate([
      { $match: { page: { $ne: null } } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Peak hours
    const peakHours = await UsageEvent.aggregate([
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Events per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const eventsPerDay = await UsageEvent.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ pageHeatmap, peakHours, eventsPerDay });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
