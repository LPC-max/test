import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const INTENTS = [
  { value: 'informational', label: 'Informationnel', bg: 'bg-blue-100', text: 'text-blue-700' },
  { value: 'transactional', label: 'Transactionnel', bg: 'bg-green-100', text: 'text-green-700' },
  { value: 'commercial', label: 'Commercial', bg: 'bg-orange-100', text: 'text-orange-700' },
  { value: 'navigational', label: 'Navigationnel', bg: 'bg-purple-100', text: 'text-purple-700' },
];

function getIntentCfg(intent) {
  return INTENTS.find(i => i.value === intent) || INTENTS[0];
}

function PosBadge({ pos }) {
  if (!pos && pos !== 0) return <span className="text-gray-400">—</span>;
  const cls = pos <= 3 ? 'bg-emerald-500' : pos <= 10 ? 'bg-blue-500' : pos <= 20 ? 'bg-amber-400' : 'bg-red-400';
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${cls} text-white text-xs font-bold`}>{pos}</span>;
}

function DifficultyBar({ val }) {
  const color = val <= 30 ? 'bg-emerald-400' : val <= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${val}%` }} />
      </div>
      <span className="text-xs text-gray-500">{val}</span>
    </div>
  );
}

function EvoCell({ kw }) {
  if (!kw.prev_position || kw.position === kw.prev_position) return <span className="text-gray-400 text-xs">stable</span>;
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

const EMPTY = { keyword: '', position: '', prev_position: '', volume: '', difficulty: '', intent: 'informational', segment: 'Général', page_url: '', clicks: '', impressions: '', ctr: '' };

export default function SEOKeywords() {
  const [searchParams] = useSearchParams();
  const [keywords, setKeywords] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    intent: searchParams.get('intent') || '',
    segment: searchParams.get('segment') || '',
    evolution: searchParams.get('evolution') || '',
    position_min: searchParams.get('position_min') || '',
    position_max: searchParams.get('position_max') || '',
  });
  const [sort, setSort] = useState({ field: 'position', order: 'asc' });

  const fetchKeywords = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('sort', sort.field);
    params.set('order', sort.order);
    fetch(`/api/seo/keywords?${params}`)
      .then(r => r.json())
      .then(data => { setKeywords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters, sort]);

  useEffect(() => { fetchKeywords(); }, [fetchKeywords]);
  useEffect(() => {
    fetch('/api/seo/segments').then(r => r.json()).then(setSegments).catch(() => {});
  }, []);

  function handleSort(field) {
    setSort(s => ({ field, order: s.field === field && s.order === 'asc' ? 'desc' : 'asc' }));
  }

  function SortIcon({ field }) {
    if (sort.field !== field) return <svg className="w-3 h-3 text-gray-300 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    return sort.order === 'asc'
      ? <svg className="w-3 h-3 text-indigo-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3 h-3 text-indigo-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>;
  }

  function openAdd() { setForm(EMPTY); setEditId(null); setModal('add'); }
  function openEdit(kw) {
    setForm({ keyword: kw.keyword, position: kw.position ?? '', prev_position: kw.prev_position ?? '', volume: kw.volume ?? '', difficulty: kw.difficulty ?? '', intent: kw.intent, segment: kw.segment, page_url: kw.page_url ?? '', clicks: kw.clicks ?? '', impressions: kw.impressions ?? '', ctr: kw.ctr ?? '' });
    setEditId(kw.id);
    setModal('edit');
  }

  async function handleSave() {
    if (!form.keyword.trim()) return;
    setSaving(true);
    const body = { ...form, position: form.position ? parseInt(form.position) : null, prev_position: form.prev_position ? parseInt(form.prev_position) : null, volume: parseInt(form.volume) || 0, difficulty: parseInt(form.difficulty) || 0, clicks: parseInt(form.clicks) || 0, impressions: parseInt(form.impressions) || 0, ctr: parseFloat(form.ctr) || 0 };
    const url = modal === 'edit' ? `/api/seo/keywords/${editId}` : '/api/seo/keywords';
    const method = modal === 'edit' ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    setModal(null);
    fetchKeywords();
    fetch('/api/seo/segments').then(r => r.json()).then(setSegments).catch(() => {});
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce mot-clé ?')) return;
    await fetch(`/api/seo/keywords/${id}`, { method: 'DELETE' });
    fetchKeywords();
  }

  async function handleImport() {
    setImportError('');
    let data;
    try {
      data = JSON.parse(importText);
      if (!Array.isArray(data)) throw new Error();
    } catch {
      setImportError('Format invalide. Attendu : tableau JSON [{"keyword":"...","position":5,...}]');
      return;
    }
    const r = await fetch('/api/seo/keywords/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: data }) });
    const res = await r.json();
    if (res.imported) {
      setImportModal(false);
      setImportText('');
      fetchKeywords();
    } else {
      setImportError(res.error || 'Erreur import');
    }
  }

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Mots-clés SEO</h1>
          <p className="text-sm text-gray-500">{keywords.length} résultat{keywords.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportModal(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Importer
          </button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Rechercher…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={filters.intent} onChange={e => setFilters(f => ({ ...f, intent: e.target.value }))}>
            <option value="">Toutes intentions</option>
            {INTENTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={filters.segment} onChange={e => setFilters(f => ({ ...f, segment: e.target.value }))}>
            <option value="">Tous segments</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={filters.evolution} onChange={e => setFilters(f => ({ ...f, evolution: e.target.value }))}>
            <option value="">Évolution</option>
            <option value="up">En hausse</option>
            <option value="down">En baisse</option>
            <option value="stable">Stable</option>
          </select>
          <div className="flex gap-2">
            <input type="number" placeholder="Pos. min" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={filters.position_min} onChange={e => setFilters(f => ({ ...f, position_min: e.target.value }))} />
            <input type="number" placeholder="max" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={filters.position_max} onChange={e => setFilters(f => ({ ...f, position_max: e.target.value }))} />
          </div>
          {activeFilters > 0 && (
            <button onClick={() => setFilters({ search: '', intent: '', segment: '', evolution: '', position_min: '', position_max: '' })} className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
              Réinitialiser ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun mot-clé trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[['keyword', 'Mot-clé'], ['position', 'Pos.'], [null, 'Évolution'], ['volume', 'Volume'], ['difficulty', 'Difficulté'], [null, 'Intention'], [null, 'Segment'], ['clicks', 'Clics'], ['ctr', 'CTR']].map(([field, label]) => (
                    <th key={label} className={`px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide ${field ? 'cursor-pointer hover:text-indigo-600 select-none' : ''}`} onClick={() => field && handleSort(field)}>
                      {label}{field && <SortIcon field={field} />}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => {
                  const intent = getIntentCfg(kw.intent);
                  return (
                    <tr key={kw.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{kw.keyword}</div>
                        {kw.page_url && <a href={kw.page_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate block max-w-xs">{kw.page_url}</a>}
                      </td>
                      <td className="px-4 py-3"><PosBadge pos={kw.position} /></td>
                      <td className="px-4 py-3"><EvoCell kw={kw} /></td>
                      <td className="px-4 py-3 font-medium text-gray-700">{kw.volume?.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3"><DifficultyBar val={kw.difficulty || 0} /></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${intent.bg} ${intent.text}`}>{intent.label}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{kw.segment}</span></td>
                      <td className="px-4 py-3 text-gray-600">{kw.clicks?.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-gray-600">{kw.ctr?.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(kw)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(kw.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'edit' ? 'Modifier le mot-clé' : 'Ajouter un mot-clé'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mot-clé *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} placeholder="ex: agence seo paris" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Position actuelle</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="ex: 5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Position précédente</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.prev_position} onChange={e => setForm(f => ({ ...f, prev_position: e.target.value }))} placeholder="ex: 8" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Volume mensuel</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} placeholder="ex: 1200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulté (0–100)</label>
                <input type="number" min="0" max="100" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} placeholder="ex: 45" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Intention</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.intent} onChange={e => setForm(f => ({ ...f, intent: e.target.value }))}>
                  {INTENTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Segment</label>
                <input list="segments-list" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} placeholder="ex: Blog" />
                <datalist id="segments-list">{segments.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">URL de la page</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.page_url} onChange={e => setForm(f => ({ ...f, page_url: e.target.value }))} placeholder="/blog/ma-page" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Clics (GSC)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.clicks} onChange={e => setForm(f => ({ ...f, clicks: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Impressions (GSC)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.impressions} onChange={e => setForm(f => ({ ...f, impressions: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CTR (%)</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.ctr} onChange={e => setForm(f => ({ ...f, ctr: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.keyword.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Importer des mots-clés</h2>
              <button onClick={() => { setImportModal(false); setImportError(''); }} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <p className="text-sm text-gray-500">Collez un tableau JSON. Champs acceptés : <code className="text-indigo-600 bg-indigo-50 px-1 rounded text-xs">keyword, position, prev_position, volume, difficulty, intent, segment, page_url, clicks, impressions, ctr</code></p>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono">
              {`[{"keyword":"seo local","position":7,"prev_position":12,"volume":880,"intent":"transactional","segment":"Local"}]`}
            </div>
            <textarea
              className="w-full h-40 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              placeholder="Collez votre JSON ici…"
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            {importError && <p className="text-sm text-red-500">{importError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setImportModal(false); setImportError(''); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleImport} disabled={!importText.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Importer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
