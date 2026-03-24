import React, { useEffect, useState, useRef } from 'react';
import { getCandidates, getJobs, updateCandidateStage } from '../api.js';
import StageTag from '../components/StageTag.jsx';
import StarRating from '../components/StarRating.jsx';

const STAGES = ['Nouveau', 'Présélection', 'Entretien RH', 'Entretien Technique', 'Offre', 'Embauché', 'Refusé'];

export default function Pipeline() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filterJob, setFilterJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dragId = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      getCandidates(filterJob ? { job_id: filterJob } : {}),
      getJobs({ status: 'active' }),
    ])
      .then(([c, j]) => { setCandidates(c); setJobs(j); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterJob]);

  const handleDragStart = (e, candidateId) => {
    dragId.current = candidateId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, stage) => {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    const candidate = candidates.find(c => c.id === id);
    if (!candidate || candidate.stage === stage) return;
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    try {
      await updateCandidateStage(id, stage);
    } catch (err) {
      setError(err.message);
      load();
    }
    dragId.current = null;
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = candidates.filter(c => c.stage === s);
    return acc;
  }, {});

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Pipeline Kanban</h2>
        <select
          value={filterJob}
          onChange={e => setFilterJob(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Toutes les offres</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex justify-between shrink-0">
          {error} <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STAGES.map(stage => (
            <div
              key={stage}
              className="flex flex-col w-52 shrink-0"
              onDrop={e => handleDrop(e, stage)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <StageTag stage={stage} />
                <span className="text-xs text-gray-400 font-medium">{byStage[stage].length}</span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-2 space-y-2 min-h-32 border-2 border-dashed border-transparent hover:border-indigo-200 transition-colors">
                {byStage[stage].map(c => (
                  <KanbanCard key={c.id} candidate={c} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanCard({ candidate, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, candidate.id)}
      className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-sm text-gray-900 leading-tight">{candidate.name}</p>
      {candidate.job_title && (
        <p className="text-xs text-indigo-500 mt-0.5 truncate">{candidate.job_title}</p>
      )}
      {candidate.score && (
        <div className="mt-1">
          <StarRating value={candidate.score} size="sm" />
        </div>
      )}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {candidate.tags.slice(0, 2).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{t}</span>
          ))}
          {candidate.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{candidate.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}
