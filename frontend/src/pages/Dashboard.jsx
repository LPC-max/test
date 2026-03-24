import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../api.js';
import StageTag from '../components/StageTag.jsx';
import StarRating from '../components/StarRating.jsx';

const STAGES = ['Nouveau', 'Présélection', 'Entretien RH', 'Entretien Technique', 'Offre', 'Embauché', 'Refusé'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="p-8 text-red-500">Erreur : {error}</div>;
  if (!stats) return <div className="p-8 text-gray-400">Chargement...</div>;

  const conversionRate = stats.totalCandidates > 0
    ? Math.round(((stats.byStage['Embauché'] || 0) / stats.totalCandidates) * 100)
    : 0;

  return (
    <div className="p-8 max-w-6xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Candidats total" value={stats.totalCandidates} color="indigo" />
        <KpiCard label="Offres actives" value={stats.totalActiveJobs} color="blue" />
        <KpiCard label="Embauchés" value={stats.byStage['Embauché'] || 0} color="green" />
        <KpiCard label="Taux de conversion" value={`${conversionRate}%`} color="purple" />
      </div>

      {/* Pipeline funnel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Pipeline par étape</h3>
        <div className="space-y-3">
          {STAGES.map(stage => {
            const count = stats.byStage[stage] || 0;
            const max = Math.max(...Object.values(stats.byStage), 1);
            const pct = Math.round((count / max) * 100);
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-40 text-sm text-gray-600 shrink-0">
                  <StageTag stage={stage} />
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-sm font-medium text-gray-700 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent candidates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Candidats récents</h3>
        {stats.recentCandidates.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun candidat pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentCandidates.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.job_title || 'Sans offre'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.score && <StarRating value={c.score} size="sm" />}
                  <StageTag stage={c.stage} />
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/candidates" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          Voir tous les candidats →
        </Link>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}
