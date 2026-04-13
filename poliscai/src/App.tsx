/**
 * App.tsx - Main Application Shell
 * The Open Document Project - Powered by PoliScAI
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentHome } from './pages/DocumentHome';
import { ConstitutionV2 } from './pages/ConstitutionV2';
import { Review } from './pages/Review';
import { Query } from './pages/Query';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Open Document Project - Main Routes */}
          <Route path="/" element={<DocumentHome />} />
          <Route path="/documents" element={<DocumentHome />} />

          {/* US Constitution */}
          <Route path="/documents/us-constitution" element={<ConstitutionV2 />} />
          <Route path="/documents/us-constitution/:clauseId" element={<ConstitutionV2 />} />

          {/* Berlin MD Ordinances (Coming Soon) */}
          <Route path="/documents/berlin-md-ordinances" element={<ComingSoon title="Berlin MD Code of Ordinances" subtitle="Document structure coming soon" />} />

          {/* Legacy routes - redirect to new structure */}
          <Route path="/constitution" element={<Navigate to="/documents/us-constitution" replace />} />
          <Route path="/constitution/:clauseId" element={<LegacyConstitutionRedirect />} />

          {/* Tools */}
          <Route path="/review" element={<Review />} />
          <Route path="/query" element={<Query />} />

          {/* Future features */}
          <Route path="/analysis" element={<ComingSoon title="Deep Analysis" />} />
          <Route path="/discover" element={<ComingSoon title="Discover Shadow Notes" />} />
          <Route path="/record/:id" element={<ComingSoon title="Public Record" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Redirect legacy constitution routes to new structure
function LegacyConstitutionRedirect() {
  const clauseId = window.location.pathname.split('/').pop();
  return <Navigate to={`/documents/us-constitution/${clauseId}`} replace />;
}

// Placeholder for future pages
function ComingSoon({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600">{subtitle || 'This feature is coming in a future phase.'}</p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Back to Documents
        </a>
      </div>
    </div>
  );
}

export default App;
