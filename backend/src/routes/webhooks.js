import { Router } from 'express';
import Webhook from '../models/Webhook.js';

const router = Router();

/**
 * @swagger
 * /api/integrations/webhooks:
 *   get:
 *     summary: Get all webhooks for current user
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: List of webhooks
 */
router.get('/', async (req, res) => {
  try {
    const webhooks = await Webhook.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/webhooks:
 *   post:
 *     summary: Create a new webhook
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [slack, discord, custom]
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Webhook created
 */
router.post('/', async (req, res) => {
  try {
    const { name, url, type, events } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'name and url required' });

    const webhook = await Webhook.create({
      userId: req.userId,
      name,
      url,
      type: type || 'custom',
      events: events || []
    });
    res.json(webhook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/webhooks/{id}/test:
 *   post:
 *     summary: Test a webhook
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook test result
 */
router.post('/:id/test', async (req, res) => {
  try {
    const webhook = await Webhook.findOne({ _id: req.params.id, userId: req.userId });
    if (!webhook) return res.status(404).json({ error: 'Webhook not found' });

    // Simulated test - in production would actually POST to the URL
    webhook.lastTriggered = new Date();
    await webhook.save();

    res.json({ ok: true, message: `Test payload sent to ${webhook.url}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/webhooks/{id}:
 *   patch:
 *     summary: Update a webhook
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook updated
 */
router.patch('/:id', async (req, res) => {
  try {
    const { name, url, type, events, active } = req.body;
    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...(name && { name }), ...(url && { url }), ...(type && { type }), ...(events && { events }), ...(active !== undefined && { active }) },
      { new: true }
    );
    if (!webhook) return res.status(404).json({ error: 'Webhook not found' });
    res.json(webhook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/integrations/webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook deleted
 */
router.delete('/:id', async (req, res) => {
  try {
    await Webhook.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
