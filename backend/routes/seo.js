const express = require('express');
const router = express.Router();
const db = require('../db');

// Add settings table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEARCH_CONSOLE_BASE = 'https://searchconsole.googleapis.com';
const SCOPES = 'https://www.googleapis.com/auth/webmasters.readonly';

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Variables manquantes : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI');
  }
  return { clientId, clientSecret, redirectUri };
}

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value);
}

async function refreshAccessToken() {
  const { clientId, clientSecret } = getConfig();
  const refreshToken = getSetting('google_refresh_token');
  if (!refreshToken) throw new Error('Non connecté à Google Search Console');

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Impossible de renouveler le token Google');
  setSetting('google_access_token', data.access_token);
  setSetting('google_token_expires', String(Date.now() + (data.expires_in - 60) * 1000));
  return data.access_token;
}

async function getAccessToken() {
  const expires = getSetting('google_token_expires');
  const accessToken = getSetting('google_access_token');
  if (accessToken && expires && Date.now() < parseInt(expires)) return accessToken;
  return refreshAccessToken();
}

async function gscFetch(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${SEARCH_CONSOLE_BASE}${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur Google API ${res.status}`);
  }
  return res.json();
}

// GET /api/seo/status
router.get('/status', (req, res) => {
  try {
    getConfig();
    const hasToken = !!getSetting('google_refresh_token');
    const site = getSetting('google_selected_site');
    res.json({ connected: hasToken, site });
  } catch (e) {
    res.json({ connected: false, site: null, config_error: e.message });
  }
});

// GET /api/seo/auth — redirige vers Google OAuth2
router.get('/auth', (req, res) => {
  try {
    const { clientId, redirectUri } = getConfig();
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    res.redirect(url.toString());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seo/callback — reçoit le code OAuth2
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Code manquant' });

    const { clientId, clientSecret, redirectUri } = getConfig();
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error(tokens.error_description || 'Erreur lors de l\'authentification');

    setSetting('google_access_token', tokens.access_token);
    setSetting('google_token_expires', String(Date.now() + (tokens.expires_in - 60) * 1000));
    if (tokens.refresh_token) setSetting('google_refresh_token', tokens.refresh_token);

    // Redirect to frontend SEO page
    res.redirect('/#/seo?connected=1');
  } catch (e) {
    res.redirect(`/#/seo?error=${encodeURIComponent(e.message)}`);
  }
});

// POST /api/seo/disconnect
router.post('/disconnect', (req, res) => {
  db.prepare("DELETE FROM settings WHERE key LIKE 'google_%'").run();
  res.json({ success: true });
});

// GET /api/seo/sites — liste les propriétés Search Console
router.get('/sites', async (req, res) => {
  try {
    const data = await gscFetch('/webmasters/v3/sites');
    const sites = (data.siteEntry || []).map(s => ({
      url: s.siteUrl,
      permission: s.permissionLevel,
    }));
    res.json(sites);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/seo/site — sélectionne le site actif
router.post('/site', (req, res) => {
  const { site } = req.body;
  if (!site) return res.status(400).json({ error: 'Site manquant' });
  setSetting('google_selected_site', site);
  res.json({ success: true, site });
});

// GET /api/seo/performance?days=28&dimension=query|page
router.get('/performance', async (req, res) => {
  try {
    const site = getSetting('google_selected_site');
    if (!site) return res.status(400).json({ error: 'Aucun site sélectionné' });

    const days = parseInt(req.query.days) || 28;
    const dimension = req.query.dimension || 'query';
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const fmt = d => d.toISOString().split('T')[0];

    const body = {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: [dimension],
      rowLimit: 25,
      startRow: 0,
    };

    const data = await gscFetch(
      `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      { method: 'POST', body: JSON.stringify(body) }
    );

    // Also fetch totals (no dimension)
    const totalsBody = { startDate: fmt(startDate), endDate: fmt(endDate), rowLimit: 1 };
    const totals = await gscFetch(
      `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      { method: 'POST', body: JSON.stringify(totalsBody) }
    );

    res.json({
      rows: data.rows || [],
      totals: totals.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      startDate: fmt(startDate),
      endDate: fmt(endDate),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/seo/timeline?days=28 — évolution quotidienne
router.get('/timeline', async (req, res) => {
  try {
    const site = getSetting('google_selected_site');
    if (!site) return res.status(400).json({ error: 'Aucun site sélectionné' });

    const days = parseInt(req.query.days) || 28;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    const fmt = d => d.toISOString().split('T')[0];

    const data = await gscFetch(
      `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['date'],
          rowLimit: 90,
        }),
      }
    );

    res.json({ rows: data.rows || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
