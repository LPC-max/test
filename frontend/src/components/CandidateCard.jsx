import React, { useState } from 'react';
import StageTag from './StageTag.jsx';
import StarRating from './StarRating.jsx';

export default function CandidateCard({ candidate, onEdit, onDelete }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{candidate.name}</h3>
          {candidate.email && (
            <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(candidate)}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Modifier"
          >✏️</button>
          {confirm ? (
            <button
              onClick={() => { onDelete(candidate.id); setConfirm(false); }}
              className="p-1 text-red-600 text-xs font-medium"
              title="Confirmer suppression"
            >Confirmer</button>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Supprimer"
            >🗑️</button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <StageTag stage={candidate.stage} />
        {candidate.score && <StarRating value={candidate.score} size="sm" />}
      </div>

      {candidate.job_title && (
        <p className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded px-2 py-0.5 inline-block">
          {candidate.job_title}
        </p>
      )}

      {candidate.tags && candidate.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {candidate.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {candidate.phone && (
        <p className="mt-1 text-xs text-gray-400">{candidate.phone}</p>
      )}

      {candidate.cv_url && (
        <a
          href={candidate.cv_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-indigo-600 hover:underline"
        >
          📄 Voir CV
        </a>
      )}
    </div>
  );
}
