import React, { useEffect, useState, useCallback } from 'react';

const PERIODS = [
  { label: '7 jours', days: 7 },
  { label: '28 jours', days: 28 },
  { label: '3 mois', days: 90 },
];

function fmt(n, dec = 0) {
  if (n === undefined || n === null) return '-';
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: dec });
}

function KpiCard({ label, value, sub, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

// Mini bar chart (pure CSS)
function BarChart({ rows, valueKey, labelKey, color = 'indigo' }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map(r => r[valueKey]));
  const colors = { indigo: 'bg-indigo-500', blue: 'bg-blue-500', green: 'bg-green-500' };
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 truncate text-xs text-gray-600 shrink-0" title={r[labelKey]}>
            {r[labelKey]}
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${colors[color]} transition-all`}
              style={{ width: `${Math.round((r[valueKey] / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-12 text-right">
            {fmt(r[valueKey])}
          </span>
        </div>
      ))}
    </div>
  );
}

// Timeline sparkline (pure SVG)
function Sparkline({ rows, color = '#6366f1' }) {
  if (!rows?.length) return null;
  const values = rows.map(r => r.clicks);
  const max = Math.max(...values, 1);
  const W = 600, H = 80;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `0,${H} ${polyline} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function SEO() {
  const [status, setStatus] = useState(null);
  const [sites, setSites] = useState([]);
  const [days, setDays] = useState(28);
  const [dimension, setDimension] = useState('query');
  const [perf, setPerf] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle OAuth redirect params
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('connected=1')) {
      window.location.hash = '#/seo';
      checkStatus();
    } else if (hash.includes('error=')) {
      const msg = decodeURIComponent(hash.split('error=')[1]);
      setError(msg);
      window.location.hash = '#/seo';
    }
  }, []);

  const checkStatus = useCallback(() => {
    fetch('/api/seo/status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  useEffect(() => {
    if (status?.connected) {
      fetch('/api/seo/sites')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setSites(data); });
    }
  }, [status?.connected]);

  const loadData = useCallback(() => {
    if (!status?.connected || !status?.site) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/seo/performance?days=${days}&dimension=${dimension}`).then(r => r.json()),
      fetch(`/api/seo/timeline?days=${days}`).then(r => r.json()),
    ])
      .then(([perfData, tlData]) => {
        if (perfData.error) throw new Error(perfData.error);
        setPerf(perfData);
        setTimeline(tlData.rows || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, days, dimension]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelectSite = async (siteUrl) => {
    await fetch('/api/seo/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteUrl }),
    });
    checkStatus();
  };

  const handleDisconnect = async () => {
    await fetch('/api/seo/disconnect', { method: 'POST' });
    setPerf(null);
    setTimeline([]);
    setSites([]);
    checkStatus();
  };

  // ─── Not configured ────────────────────────────────────────────────
  if (status?.config_error) {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🔍</span> SEO — Search Console
        </h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="font-semibold text-amber-800">Variables d'environnement manquantes</p>
          <p className="text-sm text-amber-700 mt-2">Configure ces variables dans Railway :</p>
          <div className="mt-3 space-y-1.5 font-mono text-xs bg-amber-100 rounded-lg p-4">
            <p><span className="text-amber-600">GOOGLE_CLIENT_ID</span>=ton_client_id</p>
            <p><span className="text-amber-600">GOOGLE_CLIENT_SECRET</span>=ton_client_secret</p>
            <p><span className="text-amber-600">GOOGLE_REDIRECT_URI</span>=https://ton-app.railway.app/api/seo/callback</p>
          </div>
          <p className="text-xs text-amber-600 mt-3">→ Créer les credentials sur <strong>console.cloud.google.com</strong> → APIs & Services → Credentials → OAuth 2.0</p>
        </div>
      </div>
    );
  }

  // ─── Not connected ─────────────────────────────────────────────────
  if (status && !status.connected) {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🔍</span> SEO — Search Console
        </h2>
        <p className="text-gray-500 mb-8">Connecte ton compte Google pour accéder aux données de ta Search Console.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}
        <div className="bg-white border rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 text-lg mb-1">Connecter Google Search Console</h3>
          <p className="text-sm text-gray-500 mb-6">Accède aux performances SEO : clics, impressions, CTR, position</p>
          <a
            href="/api/seo/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            Se connecter avec Google
          </a>
        </div>
      </div>
    );
  }

  // ─── Connected — site selection ────────────────────────────────────
  if (status?.connected && !status?.site) {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🔍</span> SEO — Choix du site
        </h2>
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-gray-600 mb-4">Sélectionne la propriété Search Console à analyser :</p>
          {sites.length === 0 ? (
            <p className="text-gray-400 text-sm">Chargement des sites...</p>
          ) : (
            <div className="space-y-2">
              {sites.map(s => (
                <button
                  key={s.url}
                  onClick={() => handleSelectSite(s.url)}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium text-gray-800 text-sm">{s.url}</span>
                  <span className="text-xs text-gray-400 group-hover:text-indigo-500">{s.permission} →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Dashboard SEO ─────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🔍</span> SEO — Search Console
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{status?.site}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${days === p.days ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={handleDisconnect} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Déconnecter
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex justify-between">
          {error} <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement des données...</div>
      ) : !perf ? null : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Clics totaux" value={fmt(perf.totals.clicks)} color="blue" />
            <KpiCard label="Impressions" value={fmt(perf.totals.impressions)} color="purple" />
            <KpiCard label="CTR moyen" value={`${fmt(perf.totals.ctr * 100, 1)}%`} color="green" />
            <KpiCard label="Position moy." value={fmt(perf.totals.position, 1)} sub="plus bas = mieux" color="orange" />
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">Évolution des clics</h3>
                <span className="text-xs text-gray-400">
                  {perf.startDate} → {perf.endDate}
                </span>
              </div>
              <Sparkline rows={timeline} />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{timeline[0]?.keys?.[0]}</span>
                <span>{timeline[timeline.length - 1]?.keys?.[0]}</span>
              </div>
            </div>
          )}

          {/* Top queries / pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By dimension */}
            <div className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 text-sm">
                  Top {dimension === 'query' ? 'requêtes' : 'pages'}
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {['query', 'page'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDimension(d)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${dimension === d ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                    >
                      {d === 'query' ? 'Requêtes' : 'Pages'}
                    </button>
                  ))}
                </div>
              </div>
              <BarChart
                rows={perf.rows.map(r => ({
                  label: r.keys[0].length > 35 ? r.keys[0].slice(0, 35) + '…' : r.keys[0],
                  full: r.keys[0],
                  clicks: r.clicks,
                  impressions: r.impressions,
                  ctr: r.ctr,
                  position: r.position,
                }))}
                valueKey="clicks"
                labelKey="label"
                color="indigo"
              />
            </div>

            {/* Detailed table */}
            <div className="bg-white border rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">
                Détail — {dimension === 'query' ? 'requêtes' : 'pages'}
              </h3>
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-gray-400">
                      <th className="pb-2 text-left font-medium">{dimension === 'query' ? 'Requête' : 'Page'}</th>
                      <th className="pb-2 text-right font-medium">Clics</th>
                      <th className="pb-2 text-right font-medium">Impr.</th>
                      <th className="pb-2 text-right font-medium">CTR</th>
                      <th className="pb-2 text-right font-medium">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perf.rows.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-2 text-gray-700 max-w-0 truncate" style={{ maxWidth: '180px' }} title={r.keys[0]}>
                          {r.keys[0]}
                        </td>
                        <td className="py-2 text-right font-medium text-blue-600">{fmt(r.clicks)}</td>
                        <td className="py-2 text-right text-gray-500">{fmt(r.impressions)}</td>
                        <td className="py-2 text-right text-green-600">{fmt(r.ctr * 100, 1)}%</td>
                        <td className="py-2 text-right text-orange-600">{fmt(r.position, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
