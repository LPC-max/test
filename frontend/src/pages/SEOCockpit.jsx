import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const INTENT_COLORS = {
  informational: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Informationnel' },
  transactional: { bg: 'bg-green-100', text: 'text-green-700', label: 'Transactionnel' },
  commercial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Commercial' },
  navigational: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Navigationnel' },
};

function PosBadge({ pos }) {
  if (!pos) return <span className="text-gray-400">—</span>;
  if (pos <= 3) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-bold">{pos}</span>;
  if (pos <= 10) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">{pos}</span>;
  if (pos <= 20) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-white text-sm font-bold">{pos}</span>;
  return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-400 text-white text-sm font-bold">{pos}</span>;
}

function EvoTag({ kw }) {
  if (!kw.prev_position || kw.position === kw.prev_position) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  const diff = kw.prev_position - kw.position;
  if (diff > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
      +{diff}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
      {diff}
    </span>
  );
}

function KpiCard({ label, value, sub, color = 'indigo', icon }) {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-400 to-amber-500',
    blue: 'from-blue-500 to-blue-600',
    violet: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl font-extrabold tracking-tight">{value ?? '—'}</div>
        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-sm font-semibold opacity-90">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  );
}

function KeywordRow({ kw }) {
  const intent = INTENT_COLORS[kw.intent] || INTENT_COLORS.informational;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <PosBadge pos={kw.position} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{kw.keyword}</p>
          <p className="text-xs text-gray-400">{kw.volume?.toLocaleString('fr-FR')} rech./mois</p>
        </div>
      </div>
      <EvoTag kw={kw} />
    </div>
  );
}

function SegmentBar({ label, count, total, avgPos, clicks }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{count} mots-clés</span>
          <span>pos. moy. <strong className="text-gray-700">{avgPos}</strong></span>
          <span className="text-indigo-600 font-semibold">{clicks?.toLocaleString('fr-FR')} clics</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SEOCockpit() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seo/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Chargement du cockpit SEO…</p>
      </div>
    </div>
  );

  if (!stats) return <div className="p-8 text-red-500">Erreur de chargement</div>;

  const totalKw = stats.total || 1;
  const { positionBuckets: pb } = stats;

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Cockpit SEO</h1>
              <p className="text-sm text-gray-500">Vue d'ensemble · Piloter vos positions en temps réel</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/seo/keywords" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            Mots-clés
          </Link>
          <Link to="/seo/pages" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Pages
          </Link>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Position moyenne"
          value={stats.avgPosition}
          sub="sur tous les mots-clés"
          color="indigo"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <KpiCard
          label="Top 3"
          value={stats.top3}
          sub={`${Math.round((stats.top3 / totalKw) * 100)}% du portefeuille`}
          color="emerald"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
        <KpiCard
          label="Top 10"
          value={stats.top10}
          sub={`${Math.round((stats.top10 / totalKw) * 100)}% du portefeuille`}
          color="blue"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
        />
        <KpiCard
          label="Total mots-clés"
          value={stats.total}
          sub="dans le portefeuille"
          color="violet"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
      </div>

      {/* KPI Row 2 — Evolution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="En hausse" value={stats.climbing}
          sub="positions gagnées"
          color="emerald"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>}
        />
        <KpiCard label="En baisse" value={stats.declining}
          sub="positions perdues"
          color="red"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>}
        />
        <KpiCard label="Quick Wins" value={stats.quickWins}
          sub="pos. 4–10, vol. ≥ 500"
          color="amber"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <KpiCard label="À travailler" value={pb.pos21plus}
          sub="position 21 et plus"
          color="orange"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* Distribution des positions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Distribution des positions</h2>
        <div className="flex h-10 rounded-xl overflow-hidden gap-0.5">
          {[
            { label: 'Top 3', count: pb.top3, color: 'bg-emerald-500' },
            { label: '4–10', count: pb.pos4_10, color: 'bg-blue-500' },
            { label: '11–20', count: pb.pos11_20, color: 'bg-amber-400' },
            { label: '21+', count: pb.pos21plus, color: 'bg-red-400' },
          ].map(b => {
            const pct = totalKw > 0 ? (b.count / totalKw) * 100 : 0;
            return pct > 0 ? (
              <div key={b.label} className={`${b.color} flex items-center justify-center text-white text-xs font-bold transition-all`} style={{ width: `${pct}%` }} title={`${b.label} : ${b.count} mots-clés`}>
                {pct > 8 && `${b.count}`}
              </div>
            ) : null;
          })}
        </div>
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          {[
            { label: 'Top 3', count: pb.top3, color: 'bg-emerald-500' },
            { label: 'Top 4–10', count: pb.pos4_10, color: 'bg-blue-500' },
            { label: 'Top 11–20', count: pb.pos11_20, color: 'bg-amber-400' },
            { label: 'Position 21+', count: pb.pos21plus, color: 'bg-red-400' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5 text-sm text-gray-600">
              <div className={`w-3 h-3 rounded-sm ${b.color}`} />
              {b.label} <strong className="text-gray-800">({b.count})</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Panels: En hausse / En baisse + Quick Wins / À travailler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En hausse */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
              </div>
              <h2 className="font-bold text-gray-800">En hausse</h2>
            </div>
            <Link to="/seo/keywords?evolution=up" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
          </div>
          {stats.topClimbing.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun mot-clé en hausse</p>
            : stats.topClimbing.map(kw => <KeywordRow key={kw.id} kw={kw} />)}
        </div>

        {/* En baisse */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <h2 className="font-bold text-gray-800">En baisse</h2>
            </div>
            <Link to="/seo/keywords?evolution=down" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
          </div>
          {stats.topDeclining.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun mot-clé en baisse</p>
            : stats.topDeclining.map(kw => <KeywordRow key={kw.id} kw={kw} />)}
        </div>

        {/* Quick Wins */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Quick Wins</h2>
                <p className="text-xs text-gray-400">Position 4–10 · volume ≥ 500</p>
              </div>
            </div>
            <Link to="/seo/keywords?position_min=4&position_max=10" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
          </div>
          {stats.quickWinsList.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun quick win détecté</p>
            : stats.quickWinsList.map(kw => <KeywordRow key={kw.id} kw={kw} />)}
        </div>

        {/* À travailler */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-800">À travailler</h2>
                <p className="text-xs text-gray-400">Position 21+ · fort potentiel</p>
              </div>
            </div>
            <Link to="/seo/keywords?position_min=21" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
          </div>
          {stats.toWork.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun mot-clé à travailler</p>
            : stats.toWork.map(kw => <KeywordRow key={kw.id} kw={kw} />)}
        </div>
      </div>

      {/* Segments + Intents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5">Performance par segment</h2>
          {stats.bySegment.map(s => (
            <SegmentBar key={s.segment} label={s.segment} count={s.count} total={totalKw} avgPos={s.avg_pos} clicks={s.total_clicks} />
          ))}
        </div>

        {/* Intents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-5">Intentions de recherche</h2>
          <div className="space-y-3">
            {stats.byIntent.map(i => {
              const cfg = INTENT_COLORS[i.intent] || INTENT_COLORS.informational;
              const pct = totalKw > 0 ? Math.round((i.count / totalKw) * 100) : 0;
              return (
                <div key={i.intent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-sm font-bold text-gray-700">{i.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i.intent === 'informational' ? 'bg-blue-400' : i.intent === 'transactional' ? 'bg-green-400' : i.intent === 'commercial' ? 'bg-orange-400' : 'bg-purple-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
