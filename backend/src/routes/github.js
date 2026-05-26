import { Router } from 'express';
import GitHubIntegration from '../models/GitHubIntegration.js';

const router = Router();

/**
 * @swagger
 * /api/integrations/github:
 *   get:
 *     summary: Get GitHub integration for current user
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: GitHub integration details
 */
router.get('/', async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({ userId: req.userId });
    if (!integration) return res.json(null);
    res.json({
      id: integration._id,
      repoUrl: integration.repoUrl,
      repoName: integration.repoName,
      connected: integration.connected,
      lastSync: integration.lastSync,
      createdAt: integration.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/github:
 *   post:
 *     summary: Connect a GitHub repository
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               repoUrl:
 *                 type: string
 *               personalAccessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: GitHub integration created
 */
router.post('/', async (req, res) => {
  try {
    const { repoUrl, personalAccessToken } = req.body;
    if (!repoUrl || !personalAccessToken) {
      return res.status(400).json({ error: 'repoUrl and personalAccessToken required' });
    }

    const repoName = repoUrl.split('/').slice(-2).join('/').replace('.git', '');

    let integration = await GitHubIntegration.findOne({ userId: req.userId });
    if (integration) {
      integration.repoUrl = repoUrl;
      integration.personalAccessToken = personalAccessToken;
      integration.repoName = repoName;
      integration.connected = true;
      integration.lastSync = new Date();
      await integration.save();
    } else {
      integration = await GitHubIntegration.create({
        userId: req.userId,
        repoUrl,
        personalAccessToken,
        repoName,
        lastSync: new Date()
      });
    }

    res.json({
      id: integration._id,
      repoUrl: integration.repoUrl,
      repoName: integration.repoName,
      connected: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/github/commits:
 *   get:
 *     summary: Get recent commits (simulated)
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: List of recent commits
 */
router.get('/commits', async (req, res) => {
  try {
    const integration = await GitHubIntegration.findOne({ userId: req.userId });
    if (!integration) return res.status(404).json({ error: 'No GitHub integration found' });

    // Simulated commits
    const commits = [
      { sha: 'a1b2c3d', message: 'Update model architecture', author: 'user', date: new Date(Date.now() - 3600000).toISOString() },
      { sha: 'e4f5g6h', message: 'Add data preprocessing pipeline', author: 'user', date: new Date(Date.now() - 7200000).toISOString() },
      { sha: 'i7j8k9l', message: 'Fix training loop bug', author: 'user', date: new Date(Date.now() - 14400000).toISOString() },
      { sha: 'm0n1o2p', message: 'Add hyperparameter config', author: 'user', date: new Date(Date.now() - 28800000).toISOString() },
      { sha: 'q3r4s5t', message: 'Initial commit', author: 'user', date: new Date(Date.now() - 86400000).toISOString() },
    ];

    res.json(commits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/github:
 *   delete:
 *     summary: Disconnect GitHub integration
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: Integration disconnected
 */
router.delete('/', async (req, res) => {
  try {
    await GitHubIntegration.findOneAndDelete({ userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
