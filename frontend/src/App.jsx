import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Candidates from './pages/Candidates.jsx';
import HubspotCandidates from './pages/HubspotCandidates.jsx';
import SEOCockpit from './pages/SEOCockpit.jsx';
import SEOKeywords from './pages/SEOKeywords.jsx';
import SEOPages from './pages/SEOPages.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/hubspot" element={<HubspotCandidates />} />
            <Route path="/seo" element={<Navigate to="/seo/cockpit" replace />} />
            <Route path="/seo/cockpit" element={<SEOCockpit />} />
            <Route path="/seo/keywords" element={<SEOKeywords />} />
            <Route path="/seo/pages" element={<SEOPages />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
