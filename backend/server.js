const express = require('express');
const cors = require('cors');
const db = require('./db');

const jobsRouter = require('./routes/jobs');
const candidatesRouter = require('./routes/candidates');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/candidates', candidatesRouter);

// Dashboard stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const totalCandidates = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
    const byStage = db.prepare(`
      SELECT stage, COUNT(*) as count FROM candidates GROUP BY stage
    `).all();
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE status = ?').get('active');
    const recentCandidates = db.prepare(`
      SELECT c.*, j.title as job_title
      FROM candidates c
      LEFT JOIN jobs j ON c.job_id = j.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    const stageMap = {};
    byStage.forEach(row => { stageMap[row.stage] = row.count; });

    res.json({
      totalCandidates: totalCandidates.count,
      totalActiveJobs: totalJobs.count,
      byStage: stageMap,
      recentCandidates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ATS Backend running on http://localhost:${PORT}`);
});
