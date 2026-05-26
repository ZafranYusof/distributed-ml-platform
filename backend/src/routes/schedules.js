import { Router } from 'express';
import cron from 'node-cron';
import Schedule from '../models/Schedule.js';

const router = Router();
const activeJobs = new Map();

// Helper to calculate next run from cron expression
function getNextRun(cronExpr) {
  try {
    const interval = cron.validate(cronExpr);
    if (!interval) return null;
    // Simple approximation - return next minute for valid crons
    return new Date(Date.now() + 60000);
  } catch {
    return null;
  }
}

// Start a cron job for a schedule
function startJob(schedule, io) {
  if (activeJobs.has(schedule._id.toString())) {
    activeJobs.get(schedule._id.toString()).stop();
  }

  if (!cron.validate(schedule.cronExpression)) return;

  const job = cron.schedule(schedule.cronExpression, async () => {
    try {
      schedule.lastRun = new Date();
      schedule.lastStatus = 'running';
      await schedule.save();

      if (io) {
        io.emit('schedule:running', { id: schedule._id, name: schedule.name });
      }

      // Simulate training completion after a delay
      setTimeout(async () => {
        schedule.lastStatus = 'completed';
        schedule.runHistory.push({
          startedAt: schedule.lastRun,
          completedAt: new Date(),
          status: 'completed',
          metrics: { loss: Math.random() * 0.5, accuracy: 0.7 + Math.random() * 0.3 }
        });
        await schedule.save();

        if (io) {
          io.emit('schedule:completed', { id: schedule._id, name: schedule.name });
        }
      }, 5000);
    } catch (err) {
      schedule.lastStatus = 'failed';
      await schedule.save();
    }
  });

  activeJobs.set(schedule._id.toString(), job);
}

// Initialize all enabled schedules on startup
export async function initSchedules(io) {
  try {
    const schedules = await Schedule.find({ enabled: true });
    for (const schedule of schedules) {
      startJob(schedule, io);
    }
    console.log(`Initialized ${schedules.length} scheduled jobs`);
  } catch (err) {
    console.error('Failed to init schedules:', err);
  }
}

// List schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create schedule
router.post('/', async (req, res) => {
  try {
    const { name, cronExpression, datasetConfig, modelConfig } = req.body;

    if (!cron.validate(cronExpression)) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }

    const schedule = new Schedule({
      name,
      userId: req.userId,
      cronExpression,
      datasetConfig,
      modelConfig,
      nextRun: getNextRun(cronExpression)
    });
    await schedule.save();
    startJob(schedule, req.app.get('io'));
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle schedule
router.patch('/:id/toggle', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.userId });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    schedule.enabled = !schedule.enabled;
    await schedule.save();

    if (schedule.enabled) {
      startJob(schedule, req.app.get('io'));
    } else {
      const job = activeJobs.get(schedule._id.toString());
      if (job) {
        job.stop();
        activeJobs.delete(schedule._id.toString());
      }
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, userId: req.userId });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    const job = activeJobs.get(schedule._id.toString());
    if (job) {
      job.stop();
      activeJobs.delete(schedule._id.toString());
    }

    await schedule.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
