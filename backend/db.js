const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ats.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    location TEXT,
    type TEXT CHECK(type IN ('CDI', 'CDD', 'Stage', 'Freelance')) NOT NULL DEFAULT 'CDI',
    status TEXT CHECK(status IN ('active', 'archived')) NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cv_url TEXT,
    notes TEXT,
    score INTEGER CHECK(score BETWEEN 1 AND 5),
    tags TEXT DEFAULT '[]',
    stage TEXT CHECK(stage IN ('Nouveau', 'Présélection', 'Entretien RH', 'Entretien Technique', 'Offre', 'Embauché', 'Refusé')) NOT NULL DEFAULT 'Nouveau',
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed some demo data if empty
const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
if (jobCount.count === 0) {
  const insertJob = db.prepare(`
    INSERT INTO jobs (title, description, department, location, type, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const job1 = insertJob.run(
    'Développeur Full Stack Senior',
    'Nous recherchons un développeur Full Stack expérimenté maîtrisant React et Node.js pour rejoindre notre équipe produit.',
    'Ingénierie',
    'Paris (Hybride)',
    'CDI',
    'active'
  );

  const job2 = insertJob.run(
    'Product Manager',
    'Poste de Product Manager pour piloter la roadmap de notre plateforme SaaS B2B.',
    'Produit',
    'Lyon',
    'CDI',
    'active'
  );

  const job3 = insertJob.run(
    'Stage Marketing Digital',
    'Stage de 6 mois au sein de l\'équipe marketing pour travailler sur la stratégie de contenu et les campagnes digitales.',
    'Marketing',
    'Paris',
    'Stage',
    'active'
  );

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (name, email, phone, cv_url, notes, score, tags, stage, job_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCandidate.run('Alice Martin', 'alice.martin@email.com', '06 12 34 56 78', 'https://example.com/cv/alice', 'Excellente candidate, 8 ans d\'expérience React.', 5, JSON.stringify(['React', 'Node.js', 'TypeScript']), 'Entretien Technique', job1.lastInsertRowid);
  insertCandidate.run('Bob Dupont', 'bob.dupont@email.com', '06 98 76 54 32', '', 'Profil intéressant, à recontacter.', 3, JSON.stringify(['Vue.js', 'Python']), 'Présélection', job1.lastInsertRowid);
  insertCandidate.run('Claire Bernard', 'claire.b@email.com', '07 11 22 33 44', 'https://example.com/cv/claire', 'Très bon entretien RH, motivée.', 4, JSON.stringify(['Agile', 'Scrum', 'Jira']), 'Entretien RH', job2.lastInsertRowid);
  insertCandidate.run('David Leroy', 'david.leroy@email.com', '06 55 66 77 88', '', 'À évaluer.', null, JSON.stringify([]), 'Nouveau', job1.lastInsertRowid);
  insertCandidate.run('Emma Petit', 'emma.petit@email.com', '07 44 55 66 77', 'https://example.com/cv/emma', 'Stage marketing, profil dynamique.', 4, JSON.stringify(['SEO', 'Content', 'Social Media']), 'Offre', job3.lastInsertRowid);
  insertCandidate.run('François Moreau', 'f.moreau@email.com', '', '', 'Refusé après entretien technique.', 2, JSON.stringify(['Angular']), 'Refusé', job1.lastInsertRowid);
  insertCandidate.run('Sophie Roux', 'sophie.roux@email.com', '06 22 33 44 55', 'https://example.com/cv/sophie', 'Embauchée ! Début le 1er avril.', 5, JSON.stringify(['Product', 'Analytics', 'SQL']), 'Embauché', job2.lastInsertRowid);
}

module.exports = db;
