const BASE_URL = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Stats
export const getStats = () => request('/stats');

// Jobs
export const getJobs = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/jobs${qs ? '?' + qs : ''}`);
};
export const getJob = (id) => request(`/jobs/${id}`);
export const createJob = (data) => request('/jobs', { method: 'POST', body: data });
export const updateJob = (id, data) => request(`/jobs/${id}`, { method: 'PUT', body: data });
export const archiveJob = (id) => request(`/jobs/${id}/archive`, { method: 'PATCH' });
export const deleteJob = (id) => request(`/jobs/${id}`, { method: 'DELETE' });

// Candidates
export const getCandidates = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  ).toString();
  return request(`/candidates${qs ? '?' + qs : ''}`);
};
export const getCandidate = (id) => request(`/candidates/${id}`);
export const createCandidate = (data) => request('/candidates', { method: 'POST', body: data });
export const updateCandidate = (id, data) => request(`/candidates/${id}`, { method: 'PUT', body: data });
export const updateCandidateStage = (id, stage) => request(`/candidates/${id}/stage`, { method: 'PATCH', body: { stage } });
export const deleteCandidate = (id) => request(`/candidates/${id}`, { method: 'DELETE' });
