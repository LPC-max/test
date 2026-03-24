const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all jobs
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT j.*, COUNT(c.id) as candidate_count
      FROM jobs j
      LEFT JOIN candidates c ON c.job_id = j.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE j.status = ?';
      params.push(status);
    }
    query += ' GROUP BY j.id ORDER BY j.created_at DESC';
    const jobs = db.prepare(query).all(...params);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single job with candidates
router.get('/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const candidates = db.prepare('SELECT * FROM candidates WHERE job_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...job, candidates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create job
router.post('/', (req, res) => {
  try {
    const { title, description, department, location, type } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const stmt = db.prepare(`
      INSERT INTO jobs (title, description, department, location, type)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, description || '', department || '', location || '', type || 'CDI');
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update job
router.put('/:id', (req, res) => {
  try {
    const { title, description, department, location, type, status } = req.body;
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const stmt = db.prepare(`
      UPDATE jobs SET
        title = ?,
        description = ?,
        department = ?,
        location = ?,
        type = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(
      title ?? job.title,
      description ?? job.description,
      department ?? job.department,
      location ?? job.location,
      type ?? job.type,
      status ?? job.status,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH archive/unarchive
router.patch('/:id/archive', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const newStatus = job.status === 'active' ? 'archived' : 'active';
    db.prepare("UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, req.params.id);
    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE job
router.delete('/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
