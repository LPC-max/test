import React, { useEffect, useState } from 'react';
import { getCandidates, getJobs, createCandidate, updateCandidate, deleteCandidate } from '../api.js';
import CandidateCard from '../components/CandidateCard.jsx';
import StarRating from '../components/StarRating.jsx';

const STAGES = ['Nouveau', 'Présélection', 'Entretien RH', 'Entretien Technique', 'Offre', 'Embauché', 'Refusé'];
const EMPTY_FORM = { name: '', email: '', phone: '', cv_url: '', notes: '', score: null, tags: '', stage: 'Nouveau', job_id: '' };

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ stage: '', job_id: '', score: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([getCandidates(filters), getJobs()])
      .then(([c, j]) => { setCandidates(c); setJobs(j); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (candidate) => {
    setEditTarget(candidate);
    setForm({
      ...candidate,
      tags: Array.isArray(candidate.tags) ? candidate.tags.join(', ') : '',
      job_id: candidate.job_id ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      job_id: form.job_id ? Number(form.job_id) : null,
      score: form.score ? Number(form.score) : null,
    };
    try {
      if (editTarget) {
        await updateCandidate(editTarget.id, data);
      } else {
        await createCandidate(data);
      }
      setShowForm(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
      load();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    try { await deleteCandidate(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Candidats</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nouveau candidat
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex justify-between">
          {error} <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <input
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 min-w-40"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={filters.stage}
          onChange={e => setFilters({ ...filters, stage: e.target.value })}
        >
          <option value="">Toutes les étapes</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={filters.job_id}
          onChange={e => setFilters({ ...filters, job_id: e.target.value })}
        >
          <option value="">Toutes les offres</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={filters.score}
          onChange={e => setFilters({ ...filters, score: e.target.value })}
        >
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{'★'.repeat(s)}</option>)}
        </select>
        {(filters.stage || filters.job_id || filters.score || filters.search) && (
          <button
            onClick={() => setFilters({ stage: '', job_id: '', score: '', search: '' })}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-lg">
                {editTarget ? 'Modifier le candidat' : 'Nouveau candidat'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input required className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien CV</label>
                <input type="url" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.cv_url} onChange={e => setForm({ ...form, cv_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Étape</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offre associée</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.job_id} onChange={e => setForm({ ...form, job_id: e.target.value })}>
                  <option value="">Aucune</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <StarRating value={form.score} onChange={s => setForm({ ...form, score: s })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par virgule)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="React, Node.js, ..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
                <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Annuler</button>
              <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                {editTarget ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : candidates.length === 0 ? (
        <p className="text-gray-400">Aucun candidat trouvé.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map(c => (
            <CandidateCard key={c.id} candidate={c} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
