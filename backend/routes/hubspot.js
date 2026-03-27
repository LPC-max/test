const express = require('express');
const router = express.Router();

const HUBSPOT_BASE = 'https://api.hubapi.com';

function getHeaders() {
  const token = process.env.HUBSPOT_API_KEY;
  if (!token) throw new Error('HUBSPOT_API_KEY non configurée');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

const EXCLUDED_STATUSES = ['Perdu', 'Pôle Familles - PERDU', 'RH - Refusé'];

// GET /api/hubspot/candidates?page=0&limit=50&search=&categorie=&statut=
router.get('/candidates', async (req, res) => {
  try {
    const { page = 0, limit = 50, search = '', categorie = '', statut = '' } = req.query;
    const after = parseInt(page) * parseInt(limit);

    const filterGroups = ['Cat. 1', 'Cat. 2']
      .filter(cat => !categorie || cat === categorie)
      .map(cat => ({
        filters: [
          { propertyName: 'type_de_contact', operator: 'EQ', value: 'Contact Candidat' },
          { propertyName: 'categorie_1_et_2', operator: 'EQ', value: cat },
          { propertyName: 'hs_lead_status', operator: 'NOT_IN', values: EXCLUDED_STATUSES },
          ...(statut ? [{ propertyName: 'hs_lead_status', operator: 'EQ', value: statut }] : []),
        ],
      }));

    const body = {
      filterGroups,
      properties: ['firstname', 'lastname', 'email', 'phone', 'categorie_1_et_2', 'hs_lead_status', 'createdate', 'date_de_candidature'],
      sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
      limit: parseInt(limit),
      after,
    };

    if (search) {
      body.query = search;
    }

    const response = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.message || 'Erreur HubSpot' });
    }

    const data = await response.json();

    const contacts = data.results.map(c => ({
      id: c.id,
      name: [c.properties.firstname, c.properties.lastname].filter(Boolean).join(' ').replace(/\/$/, '').trim(),
      email: c.properties.email || '',
      phone: c.properties.phone || '',
      categorie: c.properties.categorie_1_et_2 || '',
      statut: c.properties.hs_lead_status || '',
      date_candidature: c.properties.date_de_candidature || '',
      created_at: c.properties.createdate || '',
      hubspot_url: `https://app.hubspot.com/contacts/25006780/record/0-1/${c.id}`,
    }));

    res.json({ contacts, total: data.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hubspot/statuts — valeurs possibles de hs_lead_status pour les candidats
router.get('/statuts', async (req, res) => {
  try {
    const response = await fetch(
      `${HUBSPOT_BASE}/crm/v3/properties/contacts/hs_lead_status`,
      { headers: getHeaders() }
    );
    if (!response.ok) return res.status(response.status).json({ error: 'Erreur HubSpot' });
    const data = await response.json();
    const statuts = (data.options || [])
      .map(o => ({ value: o.value, label: o.label }))
      .filter(o => !EXCLUDED_STATUSES.includes(o.value) && o.value.startsWith('RH'));
    res.json(statuts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
