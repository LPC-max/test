import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJob, archiveJob, createCandidate, updateCandidateStage, deleteCandidate } from '../api.js';
import StageTag from '../components/StageTag.jsx';
import StarRating from '../components/StarRating.jsx';

const STAGES = ['Nouveau', 'Présélection', 'Entretien RH', 'Entretien Technique', 'Offre', 'Embauché', 'Refusé'];
const EMPTY_FORM = { name: '', email: '', phone: '', cv_url: '', notes: '', score: null, tags: '', stage: 'Nouveau' };

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const load = () => getJob(id).then(setJob).catch(e => setError(e.message));

  useEffect(() => { load(); }, [id]);

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      await createCandidate({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        job_id: Number(id),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
  };

  const handleStageChange = async (candidateId, stage) => {
    try { await updateCandidateStage(candidateId, stage); load(); }
    catch (e) { setError(e.message); }
  };

  const handleDelete = async (candidateId) => {
    try { await deleteCandidate(candidateId); load(); }
    catch (e) { setError(e.message); }
  };

  if (error) return <div className="p-8 text-red-500">Erreur : {error}</div>;
  if (!job) return <div className="p-8 text-gray-400">Chargement...</div>;

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/jobs" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← Retour aux offres
      </Link>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-gray-500 mt-1">{job.department} — {job.location}</p>
            {job.description && <p className="text-sm text-gray-600 mt-3">{job.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${job.type === 'CDI' ? 'bg-green-100 text-green-700' : job.type === 'Stage' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
              {job.type}
            </span>
            <button
              onClick={() => archiveJob(job.id).then(load)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {job.status === 'active' ? 'Archiver' : 'Réactiver'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Candidats ({job.candidates?.length || 0})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Ajouter un candidat
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCandidate} className="bg-white border rounded-xl p-6 mb-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">Nouveau candidat</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <StarRating value={form.score} onChange={s => setForm({ ...form, score: s })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par virgule)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="React, Node.js, ..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Ajouter</button>
          </div>
        </form>
      )}

      {job.candidates?.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun candidat pour cette offre.</p>
      ) : (
        <div className="space-y-3">
          {job.candidates?.map(c => (
            <div key={c.id} className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.email}</p>
                {c.tags && JSON.parse(c.tags || '[]').map(t => (
                  <span key={t} className="inline-block mr-1 mt-1 text-xs bg-gray-100 rounded px-1.5 py-0.5">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {c.score && <StarRating value={c.score} size="sm" />}
                <select
                  value={c.stage}
                  onChange={e => handleStageChange(c.id, e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
