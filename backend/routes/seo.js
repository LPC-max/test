const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/seo/stats
router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM seo_keywords').get();
    const avgPos = db.prepare('SELECT AVG(position) as avg FROM seo_keywords WHERE position IS NOT NULL').get();
    const top3 = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE position <= 3').get();
    const top10 = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE position <= 10').get();
    const top20 = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE position <= 20').get();
    const climbing = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE prev_position IS NOT NULL AND position < prev_position').get();
    const declining = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE prev_position IS NOT NULL AND position > prev_position').get();
    const stable = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE prev_position IS NULL OR position = prev_position').get();
    const quickWins = db.prepare('SELECT COUNT(*) as count FROM seo_keywords WHERE position BETWEEN 4 AND 10 AND volume >= 500').get();

    const byIntent = db.prepare('SELECT intent, COUNT(*) as count FROM seo_keywords GROUP BY intent ORDER BY count DESC').all();
    const bySegment = db.prepare('SELECT segment, COUNT(*) as count, ROUND(AVG(position),1) as avg_pos, SUM(clicks) as total_clicks FROM seo_keywords GROUP BY segment ORDER BY total_clicks DESC').all();

    const topClimbing = db.prepare(`
      SELECT *, (prev_position - position) as gain
      FROM seo_keywords
      WHERE prev_position IS NOT NULL AND position < prev_position
      ORDER BY gain DESC LIMIT 8
    `).all();

    const topDeclining = db.prepare(`
      SELECT *, (position - prev_position) as loss
      FROM seo_keywords
      WHERE prev_position IS NOT NULL AND position > prev_position
      ORDER BY loss DESC LIMIT 8
    `).all();

    const quickWinsList = db.prepare(`
      SELECT * FROM seo_keywords
      WHERE position BETWEEN 4 AND 10 AND volume >= 500
      ORDER BY volume DESC LIMIT 8
    `).all();

    const toWork = db.prepare(`
      SELECT * FROM seo_keywords
      WHERE position > 20
      ORDER BY volume DESC LIMIT 8
    `).all();

    const positionBuckets = {
      top3: top3.count,
      pos4_10: db.prepare('SELECT COUNT(*) as c FROM seo_keywords WHERE position BETWEEN 4 AND 10').get().c,
      pos11_20: db.prepare('SELECT COUNT(*) as c FROM seo_keywords WHERE position BETWEEN 11 AND 20').get().c,
      pos21plus: db.prepare('SELECT COUNT(*) as c FROM seo_keywords WHERE position > 20').get().c,
    };

    res.json({
      total: total.count,
      avgPosition: avgPos.avg ? Math.round(avgPos.avg * 10) / 10 : null,
      top3: top3.count,
      top10: top10.count,
      top20: top20.count,
      climbing: climbing.count,
      declining: declining.count,
      stable: stable.count,
      quickWins: quickWins.count,
      positionBuckets,
      byIntent,
      bySegment,
      topClimbing,
      topDeclining,
      quickWinsList,
      toWork,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seo/keywords
router.get('/keywords', (req, res) => {
  try {
    const { intent, segment, evolution, position_min, position_max, search, sort = 'position', order = 'asc' } = req.query;
    const conditions = [];
    const params = [];

    if (intent) { conditions.push('intent = ?'); params.push(intent); }
    if (segment) { conditions.push('segment = ?'); params.push(segment); }
    if (position_min) { conditions.push('position >= ?'); params.push(parseInt(position_min)); }
    if (position_max) { conditions.push('position <= ?'); params.push(parseInt(position_max)); }
    if (search) { conditions.push('keyword LIKE ?'); params.push(`%${search}%`); }
    if (evolution === 'up') conditions.push('prev_position IS NOT NULL AND position < prev_position');
    if (evolution === 'down') conditions.push('prev_position IS NOT NULL AND position > prev_position');
    if (evolution === 'stable') conditions.push('(prev_position IS NULL OR position = prev_position)');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSorts = ['position', 'volume', 'keyword', 'difficulty', 'clicks', 'impressions', 'ctr'];
    const sortField = validSorts.includes(sort) ? sort : 'position';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    const rows = db.prepare(`SELECT * FROM seo_keywords ${where} ORDER BY ${sortField} ${sortOrder} NULLS LAST`).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seo/keywords
router.post('/keywords', (req, res) => {
  try {
    const { keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr } = req.body;
    if (!keyword) return res.status(400).json({ error: 'keyword requis' });
    const result = db.prepare(`
      INSERT INTO seo_keywords (keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(keyword, position || null, prev_position || null, volume || 0, difficulty || 0, intent || 'informational', segment || 'Général', page_url || '', clicks || 0, impressions || 0, ctr || 0);
    res.status(201).json(db.prepare('SELECT * FROM seo_keywords WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/seo/keywords/:id
router.put('/keywords/:id', (req, res) => {
  try {
    const { keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr } = req.body;
    db.prepare(`
      UPDATE seo_keywords SET keyword=?, position=?, prev_position=?, volume=?, difficulty=?,
        intent=?, segment=?, page_url=?, clicks=?, impressions=?, ctr=?, updated_at=datetime('now')
      WHERE id=?
    `).run(keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr, req.params.id);
    const updated = db.prepare('SELECT * FROM seo_keywords WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/seo/keywords/:id
router.delete('/keywords/:id', (req, res) => {
  try {
    const kw = db.prepare('SELECT id FROM seo_keywords WHERE id = ?').get(req.params.id);
    if (!kw) return res.status(404).json({ error: 'Non trouvé' });
    db.prepare('DELETE FROM seo_keywords WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seo/keywords/import
router.post('/keywords/import', (req, res) => {
  try {
    const { keywords } = req.body;
    if (!Array.isArray(keywords) || !keywords.length) return res.status(400).json({ error: 'tableau keywords requis' });
    const insert = db.prepare(`
      INSERT INTO seo_keywords (keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const run = db.transaction((rows) => {
      let n = 0;
      for (const r of rows) {
        if (!r.keyword) continue;
        insert.run(r.keyword, r.position || null, r.prev_position || null, r.volume || 0, r.difficulty || 0, r.intent || 'informational', r.segment || 'Général', r.page_url || '', r.clicks || 0, r.impressions || 0, r.ctr || 0);
        n++;
      }
      return n;
    });
    res.json({ imported: run(keywords) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seo/segments
router.get('/segments', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT segment FROM seo_keywords ORDER BY segment').all();
    res.json(rows.map(r => r.segment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seo/pages
router.get('/pages', (req, res) => {
  try {
    const { page_type, search } = req.query;
    const conditions = [];
    const params = [];
    if (page_type) { conditions.push('page_type = ?'); params.push(page_type); }
    if (search) { conditions.push('(url LIKE ? OR title LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    res.json(db.prepare(`SELECT * FROM seo_pages ${where} ORDER BY clicks DESC`).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seo/pages
router.post('/pages', (req, res) => {
  try {
    const { url, title, page_type, clicks, impressions, ctr, avg_position } = req.body;
    if (!url) return res.status(400).json({ error: 'url requis' });
    const result = db.prepare(`
      INSERT OR REPLACE INTO seo_pages (url, title, page_type, clicks, impressions, ctr, avg_position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(url, title || '', page_type || 'informational', clicks || 0, impressions || 0, ctr || 0, avg_position || 0);
    res.status(201).json(db.prepare('SELECT * FROM seo_pages WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/seo/pages/:id
router.put('/pages/:id', (req, res) => {
  try {
    const { url, title, page_type, clicks, impressions, ctr, avg_position } = req.body;
    db.prepare(`
      UPDATE seo_pages SET url=?, title=?, page_type=?, clicks=?, impressions=?, ctr=?, avg_position=?, updated_at=datetime('now')
      WHERE id=?
    `).run(url, title, page_type, clicks, impressions, ctr, avg_position, req.params.id);
    const updated = db.prepare('SELECT * FROM seo_pages WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Non trouvé' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/seo/pages/:id
router.delete('/pages/:id', (req, res) => {
  try {
    const page = db.prepare('SELECT id FROM seo_pages WHERE id = ?').get(req.params.id);
    if (!page) return res.status(404).json({ error: 'Non trouvé' });
    db.prepare('DELETE FROM seo_pages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
