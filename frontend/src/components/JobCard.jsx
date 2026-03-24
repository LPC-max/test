import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TYPE_COLORS = {
  CDI: 'bg-green-100 text-green-700',
  CDD: 'bg-blue-100 text-blue-700',
  Stage: 'bg-yellow-100 text-yellow-700',
  Freelance: 'bg-purple-100 text-purple-700',
};

export default function JobCard({ job, onArchive, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const typeColor = TYPE_COLORS[job.type] || 'bg-gray-100 text-gray-700';

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${job.status === 'archived' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
            {job.title}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">{job.department} — {job.location}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>
            {job.type}
          </span>
          {job.status === 'archived' && (
            <span className="text-xs text-gray-400">Archivée</span>
          )}
        </div>
      </div>

      {job.description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{job.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-indigo-600 font-medium">
          {job.candidate_count ?? 0} candidat{(job.candidate_count ?? 0) !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/jobs/${job.id}`}
            className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Voir →
          </Link>
          <button
            onClick={() => onArchive(job.id)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {job.status === 'active' ? 'Archiver' : 'Réactiver'}
          </button>
          {confirm ? (
            <button
              onClick={() => { onDelete(job.id); setConfirm(false); }}
              className="text-xs text-red-600 font-medium"
            >
              Confirmer
            </button>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
