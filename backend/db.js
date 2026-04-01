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

// ─── SEO Tables ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS seo_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    position INTEGER,
    prev_position INTEGER,
    volume INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 0,
    intent TEXT CHECK(intent IN ('informational','transactional','commercial','navigational')) DEFAULT 'informational',
    segment TEXT DEFAULT 'Général',
    page_url TEXT DEFAULT '',
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS seo_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT DEFAULT '',
    page_type TEXT CHECK(page_type IN ('informational','transactional')) DEFAULT 'informational',
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr REAL DEFAULT 0,
    avg_position REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed SEO demo data if empty
const seoCount = db.prepare('SELECT COUNT(*) as count FROM seo_keywords').get();
if (seoCount.count === 0) {
  const insertKw = db.prepare(`
    INSERT INTO seo_keywords (keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const keywords = [
    // Services SEO - transactional
    ['agence seo', 8, 12, 3600, 65, 'transactional', 'Services SEO', '/agence-seo', 280, 8400, 3.3],
    ['référencement naturel', 5, 7, 2900, 70, 'transactional', 'Services SEO', '/agence-seo', 420, 12000, 3.5],
    ['consultant seo', 3, 4, 1900, 60, 'transactional', 'Services SEO', '/consultant-seo', 380, 9200, 4.1],
    ['audit seo', 2, 2, 1300, 55, 'transactional', 'Services SEO', '/audit-seo', 520, 11000, 4.7],
    ['prestation seo', 15, 10, 720, 45, 'commercial', 'Services SEO', '/agence-seo', 45, 3200, 1.4],
    ['optimisation seo', 6, 9, 1600, 58, 'transactional', 'Services SEO', '/agence-seo', 210, 7800, 2.7],
    ['stratégie seo', 11, 8, 880, 50, 'commercial', 'Services SEO', '/blog/strategie-seo', 68, 4200, 1.6],
    ['rédaction seo', 4, 6, 590, 40, 'transactional', 'Services SEO', '/redaction-seo', 145, 4900, 3.0],
    ['seo freelance', 6, 4, 590, 55, 'transactional', 'Services SEO', '/seo-freelance', 82, 3400, 2.4],
    // Blog - informational
    ["qu'est-ce que le seo", 1, 1, 4400, 30, 'informational', 'Blog', '/blog/quest-ce-que-le-seo', 890, 18000, 4.9],
    ['comment améliorer son référencement', 7, 5, 2400, 45, 'informational', 'Blog', '/blog/ameliorer-referencement', 310, 9800, 3.2],
    ['différence seo sea', 3, 4, 1800, 35, 'informational', 'Blog', '/blog/seo-vs-sea', 540, 13500, 4.0],
    ['outils seo gratuits', 9, 13, 2200, 42, 'informational', 'Blog', '/blog/outils-seo-gratuits', 280, 9600, 2.9],
    ['maillage interne seo', 14, 11, 880, 38, 'informational', 'Blog', '/blog/maillage-interne', 52, 3800, 1.4],
    ['balises meta seo', 6, 8, 1100, 35, 'informational', 'Blog', '/blog/balises-meta', 190, 7200, 2.6],
    ['vitesse page google', 18, 22, 720, 40, 'informational', 'Blog', '/blog/vitesse-page', 38, 3100, 1.2],
    ['core web vitals', 12, 9, 1600, 50, 'informational', 'Blog', '/blog/core-web-vitals', 74, 5400, 1.4],
    ['schema markup seo', 22, 28, 480, 38, 'informational', 'Blog', '/blog/schema-markup', 18, 2200, 0.8],
    ['taux de rebond seo', 30, 35, 590, 32, 'informational', 'Blog', '/blog/taux-rebond', 12, 1800, 0.7],
    ['fiche produit seo', 16, 12, 480, 45, 'informational', 'Blog', '/blog/fiche-produit-seo', 32, 2400, 1.3],
    ['netlinking naturel', 25, 20, 390, 55, 'informational', 'Blog', '/blog/netlinking', 8, 1600, 0.5],
    ['recherche vocale seo', 32, 30, 260, 42, 'informational', 'Blog', '/blog/recherche-vocale', 4, 980, 0.4],
    ['seo technique', 5, 7, 1400, 58, 'informational', 'Blog', '/blog/seo-technique', 320, 9400, 3.4],
    // Outils - commercial
    ['meilleur logiciel seo', 4, 6, 1900, 52, 'commercial', 'Outils', '/blog/meilleur-logiciel-seo', 580, 14200, 4.1],
    ['semrush vs ahrefs', 7, 10, 1300, 40, 'commercial', 'Outils', '/blog/semrush-vs-ahrefs', 210, 7600, 2.8],
    ['prix seo', 9, 7, 720, 60, 'commercial', 'Outils', '/tarifs', 88, 3900, 2.3],
    // Formation
    ['formation seo en ligne', 5, 8, 2600, 55, 'commercial', 'Formation', '/formation-seo', 680, 17000, 4.0],
    // Local
    ['agence seo paris', 3, 5, 720, 70, 'transactional', 'Local', '/agence-seo-paris', 210, 6200, 3.4],
    ['agence seo lyon', 8, 12, 390, 60, 'transactional', 'Local', '/agence-seo-lyon', 68, 2800, 2.4],
    // E-commerce
    ['seo e-commerce', 7, 10, 1100, 62, 'transactional', 'E-commerce', '/seo-ecommerce', 175, 6800, 2.6],
  ];

  const insertAllKw = db.transaction((rows) => {
    for (const r of rows) insertKw.run(...r);
  });
  insertAllKw(keywords);

  const insertPage = db.prepare(`
    INSERT INTO seo_pages (url, title, page_type, clicks, impressions, ctr, avg_position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const pages = [
    ['/', 'Accueil', 'transactional', 2400, 45000, 5.3, 4.2],
    ['/agence-seo', 'Agence SEO – Référencement naturel', 'transactional', 1800, 28000, 6.4, 5.8],
    ['/blog', 'Blog SEO – Conseils & stratégies', 'informational', 3200, 89000, 3.6, 8.2],
    ["/blog/quest-ce-que-le-seo", "Qu'est-ce que le SEO ?", 'informational', 890, 18000, 4.9, 1.0],
    ['/blog/outils-seo-gratuits', 'Les meilleurs outils SEO gratuits', 'informational', 650, 14000, 4.6, 9.0],
    ['/audit-seo', 'Audit SEO complet', 'transactional', 420, 8900, 4.7, 2.0],
    ['/formation-seo', 'Formation SEO en ligne', 'transactional', 1100, 22000, 5.0, 5.0],
    ['/blog/core-web-vitals', 'Core Web Vitals : guide complet', 'informational', 340, 13000, 2.6, 12.0],
    ['/contact', 'Nous contacter', 'transactional', 210, 5400, 3.9, 6.0],
    ['/blog/maillage-interne', 'Maillage interne : stratégie SEO', 'informational', 180, 8200, 2.2, 14.0],
    ['/blog/seo-vs-sea', 'SEO vs SEA : quelle différence ?', 'informational', 540, 13500, 4.0, 3.0],
    ['/tarifs', 'Tarifs SEO', 'transactional', 280, 7200, 3.9, 9.0],
    ['/blog/balises-meta', 'Optimiser ses balises meta', 'informational', 190, 7200, 2.6, 6.0],
    ['/agence-seo-paris', 'Agence SEO Paris', 'transactional', 210, 6200, 3.4, 3.0],
    ['/seo-ecommerce', 'SEO pour e-commerce', 'transactional', 175, 6800, 2.6, 7.0],
  ];

  const insertAllPages = db.transaction((rows) => {
    for (const r of rows) insertPage.run(...r);
  });
  insertAllPages(pages);
}

module.exports = db;
