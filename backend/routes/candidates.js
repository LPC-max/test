const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all candidates with optional filters
router.get('/', (req, res) => {
  try {
    const { stage, job_id, score, search } = req.query;
    let query = `
      SELECT c.*, j.title as job_title
      FROM candidates c
      LEFT JOIN jobs j ON c.job_id = j.id
      WHERE 1=1
    `;
    const params = [];

    if (stage) { query += ' AND c.stage = ?'; params.push(stage); }
    if (job_id) { query += ' AND c.job_id = ?'; params.push(job_id); }
    if (score) { query += ' AND c.score = ?'; params.push(Number(score)); }
    if (search) {
      query += ' AND (c.name LIKE ? OR c.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC';
    const candidates = db.prepare(query).all(...params);

    // Parse tags JSON
    const result = candidates.map(c => ({
      ...c,
      tags: (() => { try { return JSON.parse(c.tags || '[]'); } catch { return []; } })()
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single candidate
router.get('/:id', (req, res) => {
  try {
    const candidate = db.prepare(`
      SELECT c.*, j.title as job_title
      FROM candidates c
      LEFT JOIN jobs j ON c.job_id = j.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    candidate.tags = (() => { try { return JSON.parse(candidate.tags || '[]'); } catch { return []; } })();
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create candidate
router.post('/', (req, res) => {
  try {
    const { name, email, phone, cv_url, notes, score, tags, stage, job_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const stmt = db.prepare(`
      INSERT INTO candidates (name, email, phone, cv_url, notes, score, tags, stage, job_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      email || '',
      phone || '',
      cv_url || '',
      notes || '',
      score || null,
      JSON.stringify(tags || []),
      stage || 'Nouveau',
      job_id || null
    );
    const candidate = db.prepare('SELECT c.*, j.title as job_title FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id WHERE c.id = ?').get(result.lastInsertRowid);
    candidate.tags = (() => { try { return JSON.parse(candidate.tags || '[]'); } catch { return []; } })();
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update candidate
router.put('/:id', (req, res) => {
  try {
    const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });

    const { name, email, phone, cv_url, notes, score, tags, stage, job_id } = req.body;

    const stmt = db.prepare(`
      UPDATE candidates SET
        name = ?,
        email = ?,
        phone = ?,
        cv_url = ?,
        notes = ?,
        score = ?,
        tags = ?,
        stage = ?,
        job_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(
      name ?? c.name,
      email ?? c.email,
      phone ?? c.phone,
      cv_url ?? c.cv_url,
      notes ?? c.notes,
      score !== undefined ? score : c.score,
      tags !== undefined ? JSON.stringify(tags) : c.tags,
      stage ?? c.stage,
      job_id !== undefined ? job_id : c.job_id,
      req.params.id
    );

    const updated = db.prepare('SELECT c.*, j.title as job_title FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id WHERE c.id = ?').get(req.params.id);
    updated.tags = (() => { try { return JSON.parse(updated.tags || '[]'); } catch { return []; } })();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update stage only (for kanban drag)
router.patch('/:id/stage', (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'Stage is required' });

    const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });

    db.prepare("UPDATE candidates SET stage = ?, updated_at = datetime('now') WHERE id = ?").run(stage, req.params.id);
    const updated = db.prepare('SELECT c.*, j.title as job_title FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id WHERE c.id = ?').get(req.params.id);
    updated.tags = (() => { try { return JSON.parse(updated.tags || '[]'); } catch { return []; } })();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE candidate
router.delete('/:id', (req, res) => {
  try {
    const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
