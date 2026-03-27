import React, { useEffect, useState, useCallback } from 'react';

const STATUTS_RH = [
  { value: '', label: 'Tous les statuts' },
  { value: 'NEW', label: 'Nouveau' },
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RH - Sélectionné', label: 'RH - Sélectionné' },
  { value: 'RH - Contacté', label: 'RH - Contacté' },
  { value: 'RH - Entretien RH', label: 'RH - Entretien RH' },
  { value: 'RH - Entretien opérationnel', label: 'RH - Entretien opérationnel' },
  { value: 'RH - Transmis directrice', label: 'RH - Transmis directrice' },
  { value: 'RH - Entretien réalisé (directrice)', label: 'RH - Entretien réalisé (directrice)' },
  { value: 'RH - Proposition d\'embauche', label: 'RH - Proposition faite' },
  { value: 'RH - Proposition acceptée', label: 'RH - Proposition acceptée' },
  { value: 'RH - Contrat envoyé', label: 'RH - Contrat signé' },
  { value: 'RH - Embauché', label: 'RH - Embauché' },
  { value: 'Vivier', label: 'Vivier' },
];

const STATUT_COLORS = {
  'NEW':                              'bg-gray-100 text-gray-600',
  'OPEN':                             'bg-blue-50 text-blue-600',
  'IN_PROGRESS':                      'bg-blue-100 text-blue-700',
  'RH - Sélectionné':                 'bg-indigo-100 text-indigo-700',
  'RH - Contacté':                    'bg-yellow-100 text-yellow-700',
  'RH - Entretien RH':                'bg-orange-100 text-orange-700',
  'RH - Entretien opérationnel':      'bg-orange-200 text-orange-800',
  'RH - Transmis directrice':         'bg-purple-100 text-purple-700',
  'RH - Entretien réalisé (directrice)': 'bg-purple-200 text-purple-800',
  "RH - Proposition d'embauche":      'bg-teal-100 text-teal-700',
  'RH - Proposition acceptée':        'bg-teal-200 text-teal-800',
  'RH - Contrat envoyé':              'bg-green-100 text-green-700',
  'RH - Embauché':                    'bg-green-200 text-green-800',
  'Vivier':                           'bg-pink-100 text-pink-700',
};

const LIMIT = 50;

export default function HubspotCandidates() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categorie, setCategorie] = useState('');
  const [statut, setStatut] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page, limit: LIMIT, search, categorie, statut });
    fetch(`/api/hubspot/candidates?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setContacts(data.contacts);
        setTotal(data.total);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, categorie, statut]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const handleFilter = (key, val) => {
    setPage(0);
    if (key === 'categorie') setCategorie(val);
    if (key === 'statut') setStatut(val);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.4 12.6c0-.4 0-.8-.1-1.2h-9.7v2.3h5.6c-.2 1.2-1 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-6.6z"/>
                <path d="M12.6 23c2.7 0 5-0.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.7v2.6C5.3 20.8 8.7 23 12.6 23z"/>
                <path d="M7 15c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V8.4H3.7C3 9.8 2.6 11.3 2.6 13s.4 3.2 1.1 4.6L7 15z"/>
                <path d="M12.6 6.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17.6 3.9 15.3 3 12.6 3 8.7 3 5.3 5.2 3.7 8.4L7 11c.8-2.3 3-4.1 5.6-4.1z"/>
              </svg>
            </span>
            Candidats HubSpot
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Contact Candidat · Cat. 1 & Cat. 2 · hors Perdu & Refusé</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{total.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400">candidats</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex justify-between items-start">
          <div>
            <p className="font-medium">Erreur de connexion HubSpot</p>
            <p className="mt-0.5 text-red-500">{error}</p>
            {error.includes('HUBSPOT_API_KEY') && (
              <p className="mt-1 text-xs text-red-400">→ Configure la variable <code className="bg-red-100 px-1 rounded">HUBSPOT_API_KEY</code> dans Railway</p>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white border rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Rechercher un nom, email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Rechercher
          </button>
        </form>

        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={categorie}
          onChange={e => handleFilter('categorie', e.target.value)}
        >
          <option value="">Cat. 1 & Cat. 2</option>
          <option value="Cat. 1">Cat. 1 uniquement</option>
          <option value="Cat. 2">Cat. 2 uniquement</option>
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 min-w-48"
          value={statut}
          onChange={e => handleFilter('statut', e.target.value)}
        >
          {STATUTS_RH.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {(search || categorie || statut) && (
          <button
            onClick={() => { setPage(0); setSearch(''); setSearchInput(''); setCategorie(''); setStatut(''); }}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-medium">Nom</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Téléphone</th>
              <th className="px-4 py-3 text-left font-medium">Catégorie</th>
              <th className="px-4 py-3 text-left font-medium">Statut RH</th>
              <th className="px-4 py-3 text-left font-medium">Créé le</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Chargement...</td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Aucun contact trouvé.</td>
              </tr>
            ) : contacts.map((c, i) => (
              <tr key={c.id} className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.name || <span className="text-gray-400 italic">Sans nom</span>}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.email || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone || <span className="text-gray-300">-</span>}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.categorie === 'Cat. 1' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                    {c.categorie}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.statut ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[c.statut] || 'bg-gray-100 text-gray-600'}`}>
                      {c.statut}
                    </span>
                  ) : <span className="text-gray-300 text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={c.hubspot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 hover:text-orange-700 hover:underline"
                  >
                    HubSpot →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page + 1} / {totalPages} — {total.toLocaleString('fr-FR')} contacts
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
