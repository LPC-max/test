import React, { useState, useEffect, useCallback } from 'react';

const TYPES = [
  { value: 'informational', label: 'Informationnel', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  { value: 'transactional', label: 'Transactionnel', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
];

function PosCircle({ pos }) {
  if (!pos) return null;
  const color = pos <= 3 ? 'text-emerald-600' : pos <= 10 ? 'text-blue-600' : pos <= 20 ? 'text-amber-500' : 'text-red-500';
  return <span className={`text-lg font-extrabold ${color}`}>{pos.toFixed(1)}</span>;
}

function CtrBadge({ ctr }) {
  const color = ctr >= 5 ? 'text-emerald-600 bg-emerald-50' : ctr >= 3 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{ctr?.toFixed(1)}%</span>;
}

const EMPTY_PAGE = { url: '', title: '', page_type: 'informational', clicks: '', impressions: '', ctr: '', avg_position: '' };

export default function SEOPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_PAGE);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPages = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('page_type', activeTab);
    if (search) params.set('search', search);
    fetch(`/api/seo/pages?${params}`)
      .then(r => r.json())
      .then(data => { setPages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab, search]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  function openAdd() { setForm(EMPTY_PAGE); setEditId(null); setModal('add'); }
  function openEdit(p) {
    setForm({ url: p.url, title: p.title || '', page_type: p.page_type, clicks: p.clicks ?? '', impressions: p.impressions ?? '', ctr: p.ctr ?? '', avg_position: p.avg_position ?? '' });
    setEditId(p.id);
    setModal('edit');
  }

  async function handleSave() {
    setSaving(true);
    const body = { ...form, clicks: parseInt(form.clicks) || 0, impressions: parseInt(form.impressions) || 0, ctr: parseFloat(form.ctr) || 0, avg_position: parseFloat(form.avg_position) || 0 };
    const url = modal === 'edit' ? `/api/seo/pages/${editId}` : '/api/seo/pages';
    const method = modal === 'edit' ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    setModal(null);
    fetchPages();
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette page ?')) return;
    await fetch(`/api/seo/pages/${id}`, { method: 'DELETE' });
    fetchPages();
  }

  const totalClicks = pages.reduce((s, p) => s + (p.clicks || 0), 0);
  const totalImpressions = pages.reduce((s, p) => s + (p.impressions || 0), 0);
  const avgCtr = pages.length > 0 ? pages.reduce((s, p) => s + (p.ctr || 0), 0) / pages.length : 0;

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pages SEO</h1>
          <p className="text-sm text-gray-500">Analyse par type · informationnel vs transactionnel</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Clics totaux</p>
          <p className="text-2xl font-extrabold text-gray-900">{totalClicks.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 mt-1">sur {pages.length} pages</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Impressions totales</p>
          <p className="text-2xl font-extrabold text-gray-900">{totalImpressions.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">CTR moyen</p>
          <p className="text-2xl font-extrabold text-gray-900">{avgCtr.toFixed(1)}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {[{ value: 'all', label: 'Toutes' }, ...TYPES].map(t => (
            <button key={t.value} onClick={() => setActiveTab(t.value)} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === t.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="flex-1 max-w-xs px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Rechercher URL ou titre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Page Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucune page trouvée</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pages.map(p => {
            const typeCfg = TYPES.find(t => t.value === p.page_type) || TYPES[0];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-1.5 ${typeCfg.bg} ${typeCfg.text}`}>{typeCfg.label}</span>
                    {p.title && <p className="text-sm font-semibold text-gray-800 leading-tight mb-0.5">{p.title}</p>}
                    <p className="text-xs text-indigo-500 truncate">{p.url}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Clics</p>
                    <p className="text-lg font-extrabold text-gray-800">{p.clicks?.toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Impressions</p>
                    <p className="text-lg font-extrabold text-gray-800">{p.impressions?.toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>Pos. moy.</span>
                    <PosCircle pos={p.avg_position} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>CTR</span>
                    <CtrBadge ctr={p.ctr} />
                  </div>
                </div>

                {/* CTR bar */}
                <div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${p.ctr >= 5 ? 'bg-emerald-400' : p.ctr >= 3 ? 'bg-amber-400' : 'bg-red-300'}`} style={{ width: `${Math.min(p.ctr * 10, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">CTR (10% max)</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal === 'edit' ? 'Modifier la page' : 'Ajouter une page'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">URL *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="/blog/ma-page" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Titre</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la page" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type de page</label>
                <div className="flex gap-3">
                  {TYPES.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, page_type: t.value }))} className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${form.page_type === t.value ? `${t.bg} ${t.text} border-current` : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Clics</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.clicks} onChange={e => setForm(f => ({ ...f, clicks: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Impressions</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.impressions} onChange={e => setForm(f => ({ ...f, impressions: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">CTR (%)</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.ctr} onChange={e => setForm(f => ({ ...f, ctr: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Position moyenne</label>
                  <input type="number" step="0.1" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.avg_position} onChange={e => setForm(f => ({ ...f, avg_position: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.url.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
