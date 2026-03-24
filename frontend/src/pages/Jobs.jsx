import React, { useEffect, useState } from 'react';
import { getJobs, createJob, archiveJob, deleteJob } from '../api.js';
import JobCard from '../components/JobCard.jsx';

const EMPTY_FORM = { title: '', description: '', department: '', location: '', type: 'CDI' };

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getJobs()
      .then(setJobs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createJob(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleArchive = async (id) => {
    try { await archiveJob(id); load(); } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    try { await deleteJob(id); load(); } catch (e) { setError(e.message); }
  };

  const filtered = jobs.filter(j => showArchived ? j.status === 'archived' : j.status === 'active');

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Offres d'emploi</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-3 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {showArchived ? 'Voir actives' : 'Voir archivées'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nouvelle offre
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex justify-between">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">Nouvelle offre</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Développeur React Senior"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="Ex: Ingénierie"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="Ex: Paris (Hybride)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option>CDI</option>
                <option>CDD</option>
                <option>Stage</option>
                <option>Freelance</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Description du poste..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Créer l'offre
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400">Aucune offre {showArchived ? 'archivée' : 'active'}.</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map(job => (
            <JobCard key={job.id} job={job} onArchive={handleArchive} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
