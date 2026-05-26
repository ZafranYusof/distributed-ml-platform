import express from 'express';
import { randomUUID } from 'crypto';
import Organization from '../models/Organization.js';
import OrgInvite from '../models/OrgInvite.js';
import User from '../models/User.js';

const router = express.Router();

// List user's organizations
router.get('/', async (req, res) => {
  try {
    const orgs = await Organization.find({ 'members.userId': req.userId })
      .populate('members.userId', 'username email');
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create organization
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const org = new Organization({
      name,
      description,
      createdBy: req.userId,
      members: [{ userId: req.userId, role: 'admin', joinedAt: new Date() }]
    });
    await org.save();
    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single organization
router.get('/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('members.userId', 'username email');
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const isMember = org.members.some(m => m.userId._id.toString() === req.userId);
    if (!isMember) return res.status(403).json({ error: 'Not a member' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update organization
router.put('/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const member = org.members.find(m => m.userId.toString() === req.userId);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, description } = req.body;
    if (name) org.name = name;
    if (description !== undefined) org.description = description;
    await org.save();
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete organization
router.delete('/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const member = org.members.find(m => m.userId.toString() === req.userId);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await Organization.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invite member
router.post('/:id/invite', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const member = org.members.find(m => m.userId.toString() === req.userId);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { email, role } = req.body;
    const token = randomUUID();
    const invite = new OrgInvite({
      orgId: org._id,
      email,
      role: role || 'member',
      token,
      invitedBy: req.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await invite.save();
    res.status(201).json({ token: invite.token, expiresAt: invite.expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept invite
router.post('/invite/accept', async (req, res) => {
  try {
    const { token } = req.body;
    const invite = await OrgInvite.findOne({ token, accepted: false });
    if (!invite) return res.status(404).json({ error: 'Invalid or expired invite' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'Invite expired' });
    const org = await Organization.findById(invite.orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const alreadyMember = org.members.some(m => m.userId.toString() === req.userId);
    if (alreadyMember) return res.status(400).json({ error: 'Already a member' });
    org.members.push({ userId: req.userId, role: invite.role, joinedAt: new Date() });
    await org.save();
    invite.accepted = true;
    await invite.save();
    res.json({ ok: true, orgId: org._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const member = org.members.find(m => m.userId.toString() === req.userId);
    if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    org.members = org.members.filter(m => m.userId.toString() !== req.params.userId);
    await org.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List pending invites for org
router.get('/:id/invites', async (req, res) => {
  try {
    const invites = await OrgInvite.find({ orgId: req.params.id, accepted: false });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
